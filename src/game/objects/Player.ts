import * as Phaser from "phaser";

type PlayerState = "riding" | "air" | "crashed";

export default class Player {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  private state: PlayerState = "riding";
  private spinDegreesThisAir = 0;

  // Controls
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyR: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Use the stick figure texture created in GameScene
    const texKey = "stick-figure";

    this.sprite = scene.physics.add.sprite(x, y, texKey);
    this.sprite.setOrigin(0.5, 0.8);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDragX(900);
    this.sprite.setMaxVelocity(520, 1200);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keyA = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyR = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  reset(x: number, y: number) {
    this.state = "riding";
    this.spinDegreesThisAir = 0;
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setAngle(0);
    this.sprite.setTint(0xffffff);
  }

  getState(): PlayerState {
    return this.state;
  }

  setCrashed() {
    this.state = "crashed";
    this.sprite.setTint(0xff6b6b);
    this.sprite.setVelocity(0, 0);
  }

  /** Called by the scene when transitioned to "air" */
  onTakeoff() {
    if (this.state === "crashed") return;
    this.state = "air";
    this.spinDegreesThisAir = 0;
  }

  /** Called by the scene when landing is successfull */
  onLand() {
    if (this.state === "crashed") return;
    this.state = "riding";
    this.sprite.setAngle(0);
  }

  consumeRestartPressed(): boolean {
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) return true;
    return false;
  }

  /**
   * Update player controls/physics.
   * Returns spinDegreesThisAir accumulated (used for trick scoring on landing).
   */
  update(dtSeconds: number, isGrounded: boolean): number {
    if (this.state === "crashed") return 0;

    // Carving controls
    const accel = 1400;
    if (this.cursors.left?.isDown) {
      this.sprite.setAccelerationX(-accel);
    } else if (this.cursors.right?.isDown) {
      this.sprite.setAccelerationX(accel);
    } else {
      this.sprite.setAccelerationX(0);
    }

    // Small hop (only if grounded)
    if (isGrounded && Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.sprite.setVelocityY(-520);
    }

    // Air state tracking
    if (!isGrounded && this.state !== "air") {
      this.onTakeoff();
    }
    if (isGrounded && this.state === "air") {
      this.onLand();
    }

    // Tricks/spin while airborne
    if (!isGrounded) {
      const spinSpeedDegPerSec = 360; // 1 rotation/sec if held
      let spinDir = 0;
      if (this.keyA.isDown) spinDir -= 1;
      if (this.keyD.isDown) spinDir += 1;

      const deltaDeg = spinDir * spinSpeedDegPerSec * dtSeconds;
      if (deltaDeg !== 0) {
        this.spinDegreesThisAir += Math.abs(deltaDeg);
        this.sprite.setAngle(this.sprite.angle + deltaDeg);
      }
    }

    // Visual tilt while carving
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;

    const targetTilt = Phaser.Math.Clamp(vx * 0.06, -18, 18);
    if (isGrounded) {
      this.sprite.setAngle(Phaser.Math.Linear(this.sprite.angle, targetTilt, 0.12));
    }

    return this.spinDegreesThisAir;
  }
}
