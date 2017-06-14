/*
 * runstant lite
 */

phina.globalize();

var SCREEN_WIDTH = 640;
var SCREEN_HEIGHT = 960;

var BLOCK_WIDTH = 40 * 2;
var BLOCK_HEIGHT = 60 / 2;
var PADDLE_WIDTH = BLOCK_WIDTH * 1.5;
var PADDLE_HEIGHT = BLOCK_HEIGHT;
var BALL_RADIUS = BLOCK_WIDTH / 8;
var BLOW_DIST       = 640*0.4;
var FPS = 60;

phina.define('MainScene', {
  superClass: 'DisplayScene',
  
  init: function() {
    this.superInit();
    
    this.backgroundColor = '#222';
    this.blockGroup = DisplayElement().addChildTo(this);
    this.blockParticleGroup = DisplayElement().addChildTo(this);
    this.chasedParticleGroup = DisplayElement().addChildTo(this);
    
    var screenRect = Rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // パドル生成
    var paddleY = this.gridY.span(15);
    var paddle = Paddle()
                    .addChildTo(this)
                    .setPosition(this.gridX.center(), paddleY);
    
    // ブロック生成
    this.createBlock();
    // ボール生成
    this.ball = Ball().addChildTo(this);

    this.paddle = paddle;
    this.screenRect = screenRect;
    this.status = 'ready';

    this.onpointmove = function (e) {
      paddle.setPosition(e.pointer.x | 0, paddleY);
    
      if (paddle.left < screenRect.left)
        paddle.left = screenRect.left;
      if (paddle.right > screenRect.right)
        paddle.right = screenRect.right;
    };
    
    var self = this;
    this.onpointend = function () {
      if (self.status === 'ready') {
        self.ball.vy = -self.ball.speed;
        self.ball.vx = paddle.dx;
        self.status = 'move';
      }
    };
  },

  createBlock: function ()
  {
    var self = this;
    Array.range(2,16, 2).each(function (spanX) {
      Array.range(1, 4, 0.5).each(function (spanY) {
        Block().addChildTo(self.blockGroup)
               .setPosition(self.gridX.span(spanX), self.gridY.span(spanY));
      });
    });
  },
  
  update: function () {
    var ball = this.ball;
    var paddle = this.paddle;
    var screenRect = this.screenRect;
    
    if (this.status === 'ready')
    {
      ball.vx = ball.vy = 0;
      ball.x = paddle.x;
      ball.bottom = paddle.top;
      return;
    }
    
    if (this.status === 'move')
    {
      ball.moveBy(ball.vx, ball.vy);
      
      // 壁とのあたり判定
      this.hitsTheWallIfCollided(ball, screenRect);
      // パドルと反射
      this.hitsThePaddleIfCollided(paddle, ball);
      // ブロックとの反射
      this.blockGroup.children.some(function (block) {
        if (ball.hitTest(block) === true)
        {
          //this.addChasedParticleCircle(ball);
          this.addBlockParticle(ball, block);
          //this.addTriangleParticle(ball, block);
          
          Block(Math.randint(BLOCK_WIDTH, SCREEN_WIDTH - BLOCK_WIDTH),
                Math.randint(BLOCK_HEIGHT, SCREEN_HEIGHT - BLOCK_HEIGHT))
            .addChildTo(this.blockGroup);
          this.hitsTheBlock(ball, block);
          
          block.remove();
          return true;
        }
        else return false;
        
      }, this);
    }
    
  },
  
  hitsThePaddleIfCollided: function (paddle, ball)
  {
    let restitution = 0.7;
    if (ball.hitTest(paddle) && ball.vy > 0)
    {
      ball.bottom = paddle.top;
       
      ball.vy = -ball.vy;
      let dx = paddle.dx === 0 ? ball.dx : paddle.dx - ball.dx;
      ball.vx = dx * restitution;
      return true;
    }
    return false;
  },
  
  hitsTheBlock: function (ball, block)
  {
    // 左上かど
    if (ball.top < block.top && ball.left < block.left)
    {
      ball.right = block.left;
      ball.bottom = block.top;
      
      ball.vx = -ball.vx;
      ball.vy = -ball.vy;
      return true;
    }
    
    // 右上かど
    if (block.top < ball.top && block.right < ball.right)
    {
      ball.left = block.right;
      ball.bottom = block.top;
      ball.vx = -ball.vx;
      ball.vy = -ball.vy;
      return true;
    }
    // 左下かど
    if (block.bottom < ball.bottom && ball.left < block.left)
    {
      ball.right = block.left;
      ball.top = block.bottom;
      ball.vx = -ball.vx;
      ball.vy = -ball.vy;
      return true;
    }
    // 右下かど
    if (block.bottom < ball.bottom && block.right < ball.right)
    {
      ball.left = block.right;
      ball.top = block.bottom;
      ball.vx = -ball.vx;
      ball.vy = -ball.vy;
      return true;
    }
    // 左側
    if (ball.left < block.left)
    {
      ball.right = block.left;
      ball.vx = -ball.vx;
      return true;
    }
    // 右側
    if (block.right < ball.right)
    {
      ball.left = block.right;
      ball.vx = -ball.vx;
      return true;
    }
    // 上側
    if (ball.top < block.top)
    {
      ball.bottom = block.top;
      ball.vy = -ball.vy;
      return true;
    }
    // 下側
    if (block.bottom < ball.bottom)
    {
      ball.top = block.bottom;
      ball.vy = -ball.vy;
      return true;
    }
  },
  
  addTriangleParticle: function (ball, block)
  {
    let particleNum = 30;
    (particleNum).times(function () {
      let particle = TriangleParticle();
      particle.addChildTo(this.blockParticleGroup);
      particle.x = block.x + Math.randint(-BLOCK_WIDTH, BLOCK_WIDTH);
      particle.y = block.y + Math.randint(-BLOCK_HEIGHT, BLOCK_HEIGHT);
      particle.radius = Math.randint(5, 40);
      particle.scaleX = Math.random() * 0.5 + 0.01;
      particle.v.set( ( ball.dx * (Math.random() + 0.1) ) || 1,
                      ( ball.dy * (Math.random() + 0.1) ) || 1);
      
      //if (ball.dy < 0)
      //  console.log("ball.dy:" + ball.dy);
      
      particle.autoRemove = true;
      particle.fill = block.fill;
    }, this);
  },
  
  addBlockParticle: function (ball, block)
  {
    let particleNum = 30;
    (particleNum).times(function () {
      let particle = BlockParticle();
      particle.addChildTo(this.blockParticleGroup);
      particle.x = block.x + Math.randint(-BLOCK_WIDTH, BLOCK_WIDTH);
      particle.y = block.y + Math.randint(-BLOCK_HEIGHT, BLOCK_HEIGHT);
      particle.width = Math.randint(1, 20);
      particle.height = Math.randint(1, 20);
      particle.v.set( ( ball.dx * (Math.random() + 0.1) ) || 1,
                      ( ball.dy * (Math.random() + 0.1) ) || 1);
      
      //if (ball.dy < 0)
      //  console.log("ball.dy:" + ball.dy);
      
      particle.autoRemove = true;
      particle.fill = block.fill;
    }, this);
  },
  
  addChasedParticle: function (target)
  {
    let particleNum = 10;
    (particleNum).times(function() {
      let particle = ChasedParticle();
      particle.addChildTo(this.chasedParticleGroup);
      particle.x = Math.randint(0, this.gridX.width);
      particle.y = Math.randint(0, this.gridY.width);
      particle.target = target;
      particle.autoRemove = true;
    }, this);
  },
  
  addChasedParticleCircle: function (target)
  {
    let particleNum = 10;
    let pi = 3.14;
    let r = 20; // px
    let count = 1;

    // パーティクルを生成
    (particleNum).times(function() {
      let particle = ChasedParticle();
      particle.addChildTo(this.chasedParticleGroup);
      
      let t = 2*pi*count++/10;
      particle.x = r * Math.cos(t) + target.x;
      particle.y = r * Math.sin(t) + target.y;
      particle.target = target;
      particle.scatter();
      particle.autoRemove = true;
    }, this);
  },
  
  hitsTheWallIfCollided: function (ball, screenRect)
  {
    if (ball.top < screenRect.top)
    {
      ball.top = screenRect.top;
      ball.vy = -ball.vy;
    }
    
    if (ball.left < screenRect.left)
    {
      ball.left = screenRect.left;
      ball.vx = -ball.vx;
    }
    
    if (ball.right > screenRect.right)
    {
      ball.right = screenRect.right;
      ball.vx = -ball.vx;
    }
    
    if (ball.bottom > screenRect.bottom)
    {
      ball.bottom = screenRect.bottom;
      ball.vy = -ball.vy;
      //this.status = 'ready';
    }
  },
  
});

phina.define('Block', {
  superClass: 'RectangleShape',
  
  init: function (x, y)
  {
    this.superInit({
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      fill: 'hsla({0}, 75%, 50%, 1)'.format(Math.randint(0,360)),
    });
    this.blendMode = 'lighter';
    if (0 <= x && x <= 640)
      this.x = x;
    if (0 <= y && y <= 960)
      this.y = y;
  },
});

phina.define('Paddle', {
  superClass: 'RectangleShape',
  
  init: function () {
    
    this.superInit({
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      fill: 'hsla({0}, 75%, 50%, 1)'.format(Math.randint(0,360)),
    });
    this.blendMode = 'lighter';
    this.deltaPosition = phina.geom.Vector2(0, 0);
    this.prevPosition = phina.geom.Vector2(0, 0);
    this.position = phina.geom.Vector2(0, 0);
    this.count = 0;
  },
  
  update: function ()
  {
    let dx = this.x - this.prevPosition.x;
    let dy = this.y - this.prevPosition.y;
    
    // 差分更新
    this.deltaPosition.x = dx;
    this.deltaPosition.y = dy;
    // 過去位置更新
    this.prevPosition.set(this.position.x, this.position.y);
    // 現在位置更新
    this.position.set(this.x, this.y);
  },
  
  _accessor:
  {
    dx:
    {
      "get": function () { return this.deltaPosition.x },
      "set": function (value) { this.deltaPosition.x = value; }
    },
    dy:
    {
      "get": function () { return this.deltaPosition.x },
      "set": function (value) { this.deltaPosition.y = value; }
    },
  },
  
});

phina.define('Ball', {
  superClass: 'CircleShape',
  
  init: function () {
    
    this.superInit({
      radius: BALL_RADIUS,
      fill: 'hsla({0}, 75%, 50%, 1)'.format(Math.randint(0,360)),
    });
    this.blendMode = 'lighter';
    this.speed = 6;
    this.v = phina.geom.Vector2(0, 0);
    this.deltaPosition = phina.geom.Vector2(0, 0);
    this.prevPosition = phina.geom.Vector2(0, 0);
    this.position = phina.geom.Vector2(0, 0);
    this.count = 0;
  },
  
  update: function (app)
  {
    let dx = this.x - this.prevPosition.x;
    let dy = this.y - this.prevPosition.y;

    this.deltaPosition.x = dx;
    this.deltaPosition.y = dy;
    
    // 過去位置更新
    this.prevPosition.set(this.position.x, this.position.y);
    // 現在位置更新
    this.position.set(this.x, this.y);
  },
  
  hitTest: function (elem)
  {
    if (this.hitTestElement(elem) === true)
    {
      this.hasHitElement = true;
      return true;
    }
    else
    {
      this.hasHitElement = false;
      return false;
    }
  },
  
  _accessor:
  {
    dx:
    {
      "get": function () { return this.deltaPosition.x },
      "set": function (value) { this.deltaPosition.x = value; }
    },
    dy:
    {
      "get": function () { return this.deltaPosition.y },
      "set": function (value) { this.deltaPosition.y = value; }
    },
  },
});


var TO_DIST         = 640;  // 距離っぽい
var STIR_DIST       = 640*0.125;
var BLOW_DIST       = 640*0.9;

phina.define('TriangleParticle', {
  superClass: 'TriangleShape',
  
  init: function ()
  {
    this.superInit({
      stroke: null,
      width: 10,
      height: 10,
    });
    
    this.v = Vector2(0, 0);
    this.blendMode = 'lighter';
    this.autoRemove = false;
    this.friction = 0.98;
  },
  
  update: function (app)
  {
    this.downfall();

    // 回転
    this.rotation += this.v.x > 0 ? this.v.length() : -this.v.length();
    
    if (this.autoRemove === true)
      this.removeIfNeeded(app);
  },

  downfall: function ()
  {
    let accel = 5 / 60;
    this.v.y += accel;
    //this.v.mul(this.friction);

    this.position.add(this.v);
  },
  
  removeIfNeeded: function (app)
  {
    if (this.right > app.gridX.width)
    {
      this.remove();
      return;
    }
    if (this.left < 0 )
    {
      this.remove();
      return;
    }
    if (this.bottom < 0)
    {
      this.remove();
      return;
    }
    if (this.top > app.gridY.width)
    {
      this.remove();
      return;
    }
  },
});

phina.define('BlockParticle', {
  superClass: 'RectangleShape',
  
  init: function ()
  {
    this.superInit({
      stroke: null,
      width: 10,
      height: 10,
    });
    
    this.v = Vector2(0, 0);
    this.blendMode = 'lighter';
    this.autoRemove = false;
    this.friction = 0.98;
  },
  
  update: function (app)
  {
    this.downfall();

    // 回転
    this.rotation += this.v.x > 0 ? this.v.length() : -this.v.length();
    
    if (this.autoRemove === true)
      this.removeIfNeeded(app);
  },

  downfall: function ()
  {
    let accel = 5 / 60;
    this.v.y += accel;
    //this.v.mul(this.friction);

    this.position.add(this.v);
  },
  
  removeIfNeeded: function (app)
  {
    // 画面右
    if (this.right > app.gridX.width)
    {
      this.remove();
      return;
    }
    // 画面左
    if (this.left < 0 )
    {
      this.remove();
      return;
    }
    /*
    // 画面上
    if (this.bottom < 0)
    {
      this.remove();
      return;
    }
    */
    // 画面下
    if (this.top > app.gridY.width)
    {
      this.remove();
      return;
    }
    
  },

});

phina.define('ChasedParticle', {
  
  superClass: 'StarShape',
  
  init: function () {
    this.superInit({
      fill: 'hsla({0}, 75%, 50%, 1)'.format(Math.randint(0,360)),
      stroke: null,
      radius: 4,
    });
    this.v = Vector2(0, 0);
    this.blendMode = 'lighter';
    this.autoRemove = false;
    this.friction = 0.98;
    this.convergence();
  },
  
  update: function (app)
  {
    let dv = Vector2.sub(this, this.target);
    let d = dv.length() || 0.001;
    dv.div(d);
    
    this.behavior(dv, d);

    this.v.mul(this.friction);
    
    this.position.add(this.v);
    // スケール
    var scale = this.v.lengthSquared() * 0.04;
    scale = Math.clamp(scale, 0.75, 2);
    this.scaleX = this.scaleY = scale;
    
    // 回転
    this.rotation += scale*10;
    
    if (this.autoRemove === true)
      this.removeIfNeeded(app);
  },
  
  removeIfNeeded: function (app)
  {
    if (this.right > app.gridX.width)
    {
      this.remove();
      return;
    }
    if (this.left < 0 )
    {
      this.remove();
      return;
    }
    if (this.bottom < 0)
    {
      this.remove();
      return;
    }
    if (this.top > app.gridY.width)
    {
      this.remove();
      return;
    }
  },
  
  behavior: function (dv, d) {},
  
  scatter: function ()
  {
    this.behavior = this._scatter;
  },
  _scatter: function (dv, d)
  {
    //let blowAcc = (1 - (d / BLOW_DIST)) * 10;
    this.v.x += dv.x * 0.1;
    this.v.y += dv.y > 0 ? dv.y * 0.98 : dv.y * -0.98;
    //this.v.x += dv.x * blowAcc + 0.5 - Math.random();
    //this.v.y += dv.y * blowAcc + 0.5 - Math.random();
  },
  
  convergence: function ()
  {
    this.behavior = this._convergence;
  },
  _convergence: function (dv, d)
  {
    if (d < TO_DIST)
    {
      let toAcc = ( 1 - ( d / TO_DIST ) ) * 640 * 0.0014;
      this.v.x -= dv.x * toAcc;
      this.v.y -= dv.y * toAcc;
    }
    
    if (d < STIR_DIST)
    {
      let mAcc = ( 1 - ( d / STIR_DIST ) * 640 * 0.00026);
      this.v.x += dv.x * mAcc * 0.1;
      this.v.y += dv.y * mAcc * 0.1;
    }
  },
  
});

phina.main(function() {
  var app = GameApp({
    title: 'Break Out',
    startLabel: 'main',
  });
  
  app.fps = FPS;
  app.enableStats();
  
  document.body.appendChild(app.domElement);
  app.run();
});
