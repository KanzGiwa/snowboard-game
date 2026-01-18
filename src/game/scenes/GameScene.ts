import * as Phaser from "phaser";
import Player from "../objects/Player";
import { ScoreSystem } from "../systems/ScoreSystem";

type Obstacle = Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.StaticBody };
type JumpPad = Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.StaticBody };

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private score = new ScoreSystem();

  private groundY = 0;

  private groundRect!: Phaser.GameObjects.Rectangle;
  private snow!: Phaser.GameObjects.TileSprite;

  private obstacles!: Phaser.GameObjects.Group;
  private jumpPads!: Phaser.GameObjects.Group;

  private uiText!: Phaser.GameObjects.Text;

  private speed = 240;
  private speedMax = 560;

  private crashed = false;
  private worldMovedPx = 0;

  // Crash overlay UI
  private overlayBg!: Phaser.GameObjects.Rectangle;
  private overlayTitle!: Phaser.GameObjects.Text;
  private overlayScore!: Phaser.GameObjects.Text;
  private menuBtn!: Phaser.GameObjects.Container;

  // Click sound (no asset needed)
  private audioCtx: AudioContext | null = null;

  // Keyboard
  private rKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("GameScene");
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.groundY = Math.floor(h * 0.78);

    // Create stick figure texture
    this.makeStickFigureTexture();

    // Background
    this.snow = this.add.tileSprite(0, 0, w, h, this.makeSnowTexture()).setOrigin(0, 0);

    // Ground visual
    this.groundRect = this.add
      .rectangle(w / 2, this.groundY + 40, w * 2, 160, 0x111827)
      .setDepth(2);

    // Physics bounds
    this.physics.world.setBounds(0, 0, w, h);

    // Static ground collider
    const groundBody = this.physics.add.staticBody(0, this.groundY, w, 20);
    groundBody.setOffset(0, 0);
    groundBody.setSize(w, 20);

    // Player
    this.player = new Player(this, Math.floor(w * 0.25), this.groundY - 40);
    this.physics.add.collider(this.player.sprite, groundBody);

    // Groups
    this.obstacles = this.add.group();
    this.jumpPads = this.add.group();

    // Spawn starting objects
    for (let i = 0; i < 6; i++) this.spawnSet(w + i * 320);

    // Jump pad overlap
    this.physics.add.overlap(this.player.sprite, this.jumpPads, (_, padObj) => {
      if (this.crashed) return;

      const pad = padObj as JumpPad;

      // Only boost if user is coming down / near ground
      const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.y > -50) {
        this.player.sprite.setVelocityY(-780);
      }

      // Small extra forward boost
      this.player.sprite.setVelocityX(body.velocity.x + 40);

      this.jumpPads.remove(pad, true, true);
    });

    // Obstacle overlap => crash
    this.physics.add.overlap(this.player.sprite, this.obstacles, () => {
      if (!this.crashed) this.onCrash();
    });

    // UI HUD
    this.uiText = this.add
      .text(14, 12, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: "#e5e7eb",
      })
      .setDepth(10);

    // Create crash overlay (hidden by default)
    this.createCrashOverlay();

    // Setup keyboard input
    this.rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Start run
    this.resetRun();
  }

  update(_time: number, deltaMs: number) {
    const dt = deltaMs / 1000;
    const w = this.scale.width;

    // If crashed, check for R key to restart
    if (this.crashed) {
      if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
        this.playClickSound();
        this.physics.resume();
        this.resetRun();
      }
      return;
    }

    // Increase speed slowly over time
    this.speed = Math.min(this.speedMax, this.speed + 18 * dt);

    // Scroll background
    this.snow.tilePositionY += this.speed * dt * 0.35;

    // Move world objects left
    const moved = this.speed * dt;
    this.worldMovedPx += moved;
    this.score.addDistance(moved);

    // Move obstacles
    this.obstacles.getChildren().forEach((obj) => {
      const r = obj as Obstacle;
      r.x -= moved;
      r.body.updateFromGameObject();
      if (r.x < -80) {
        this.obstacles.remove(r, true, true);
      }
    });

    // Move jump pads
    this.jumpPads.getChildren().forEach((obj) => {
      const r = obj as JumpPad;
      r.x -= moved;
      r.body.updateFromGameObject();
      if (r.x < -80) {
        this.jumpPads.remove(r, true, true);
      }
    });

    // Spawn ahead
    if (this.worldMovedPx > 320) {
      this.worldMovedPx = 0;
      this.spawnSet(w + 200);
    }

    // Ground detection
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;

    // Airtime scoring
    if (!grounded) {
      this.score.addAirtime(dt);
    }

    // Player update
    const spinDeg = this.player.update(dt, grounded);

    // Landing check
    if (grounded) {
      const angleAbs = Math.abs(this.player.sprite.angle);
      if (angleAbs > 25) {
        this.onCrash();
      } else {
        const trickUnits = Math.floor(spinDeg / 180);
        if (trickUnits > 0) {
          this.score.addTrickPoints(trickUnits * 120);
          this.player.sprite.setAngle(0);
        }
      }
    }

    // Update HUD
    this.uiText.setText(
      `Score: ${this.score.getScore()}   Distance: ${this.score.getDistanceMeters()}m   Airtime: ${this.score.getAirtimeSeconds()}s   Tricks: ${this.score.getTrickPoints()}`
    );
  }

  private resetRun() {
    this.crashed = false;
    this.score.reset();
    this.speed = 240;
    this.worldMovedPx = 0;

    // Hide overlay
    this.hideCrashOverlay();

    // Clear objects
    this.obstacles.clear(true, true);
    this.jumpPads.clear(true, true);

    // Reset player
    this.player.reset(Math.floor(this.scale.width * 0.25), this.groundY - 40);

    // Respawn objects
    const w = this.scale.width;
    for (let i = 0; i < 7; i++) this.spawnSet(w + i * 320);
  }

  private onCrash() {
    this.crashed = true;
    this.score.setCrashed(true);
    this.player.setCrashed();

    // Pause physics (freezes everything)
    this.physics.pause();

    // Show overlay with score
    this.showCrashOverlay();
  }

  // Crash overlay
  private createCrashOverlay() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.overlayBg = this.add
      .rectangle(w / 2, h / 2, w, h, 0x000000, 0.55)
      .setDepth(100)
      .setVisible(false);

    this.overlayTitle = this.add
      .text(w / 2, h / 2 - 110, "You Crashed!", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "42px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setVisible(false);

    this.overlayScore = this.add
      .text(w / 2, h / 2 - 45, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        color: "#e5e7eb",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setVisible(false);

    const makeButton = (label: string) => {
      const btnBg = this.add.rectangle(0, 0, 220, 54, 0x2563eb).setStrokeStyle(2, 0x1d4ed8);
      const btnText = this.add
        .text(0, 0, label, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "18px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      const btn = this.add.container(0, 0, [btnBg, btnText]).setDepth(101);
      btn.setSize(220, 54);
      btn.setInteractive({ useHandCursor: true });

      // Hover animation
      btn.on("pointerover", () => {
        this.tweens.add({
          targets: btn,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 120,
          ease: "Quad.easeOut",
        });
      });

      btn.on("pointerout", () => {
        this.tweens.add({
          targets: btn,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 120,
          ease: "Quad.easeOut",
        });
      });

      // Press feedback
      btn.on("pointerdown", () => {
        this.tweens.add({
          targets: btn,
          scaleX: 0.98,
          scaleY: 0.98,
          duration: 80,
          ease: "Quad.easeOut",
        });
      });

      btn.on("pointerup", () => {
        this.tweens.add({
          targets: btn,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 80,
          ease: "Quad.easeOut",
        });
      });

      return btn;
    };

    // Main menu button
    this.menuBtn = makeButton("Main Menu");
    this.menuBtn.setPosition(w / 2, h / 2 + 60);
    this.menuBtn.setVisible(false);
    this.menuBtn.on("pointerdown", () => {
      this.playClickSound();
      window.location.assign("/");
    });
  }

  private showCrashOverlay() {
    this.overlayBg.setVisible(true);
    this.overlayTitle.setVisible(true);
    this.overlayScore.setVisible(true);
    this.menuBtn.setVisible(true);

    this.overlayScore.setText(
      `Final Score: ${this.score.getScore()}\nDistance: ${this.score.getDistanceMeters()}m\n\nPress R to Restart`
    );
  }

  private hideCrashOverlay() {
    this.overlayBg.setVisible(false);
    this.overlayTitle.setVisible(false);
    this.overlayScore.setVisible(false);
    this.menuBtn.setVisible(false);

    this.physics.resume();
  }

  // Spawning
  private spawnSet(x: number) {
    const roll = Phaser.Math.Between(1, 100);

    // Jump pad
    if (roll <= 55) {
      const pad = this.add
        .rectangle(x, this.groundY - 8, 46, 10, 0x22c55e)
        .setDepth(3) as JumpPad;

      this.physics.add.existing(pad, true);
      pad.body.setSize(46, 10);
      this.jumpPads.add(pad);
    }

    // Obstacle
    if (roll >= 35) {
      const height = Phaser.Math.Between(28, 56);
      const width = Phaser.Math.Between(18, 28);

      const obs = this.add
        .rectangle(
          x + Phaser.Math.Between(80, 140),
          this.groundY - height / 2,
          width,
          height,
          0xf59e0b
        )
        .setDepth(3) as Obstacle;

      this.physics.add.existing(obs, true);
      obs.body.setSize(width, height);
      this.obstacles.add(obs);
    }
  }

  // Audio
  private playClickSound() {
    const AudioCtx = (window.AudioContext ||
      (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AudioCtx) return;

    if (!this.audioCtx) this.audioCtx = new AudioCtx();

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    const ctx = this.audioCtx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  // Background texture
  private makeStickFigureTexture(): string {
    const key = "stick-figure";
    if (this.textures.exists(key)) return key;

    const w = 64;
    const h = 72;
    const rt = this.make.renderTexture({ width: w, height: h }, false);

    // Clear background
    rt.fill(0x000000, 0);

    const graphics = this.add.graphics();

    // Snowboard (larger blue rectangle with border)
    graphics.fillStyle(0x3b82f6, 1);
    graphics.fillRoundedRect(4, 58, 56, 12, 3);
    
    // Snowboard outline for more visibility
    graphics.lineStyle(2, 0x1e40af, 1);
    graphics.strokeRoundedRect(4, 58, 56, 12, 3);

    // Legs (thicker white lines)
    graphics.lineStyle(4, 0xffffff, 1);
    graphics.beginPath();
    graphics.moveTo(22, 58);
    graphics.lineTo(20, 46);
    graphics.strokePath();

    graphics.beginPath();
    graphics.moveTo(42, 58);
    graphics.lineTo(44, 46);
    graphics.strokePath();

    // Body (thicker white line)
    graphics.lineStyle(4, 0xffffff, 1);
    graphics.beginPath();
    graphics.moveTo(32, 46);
    graphics.lineTo(32, 26);
    graphics.strokePath();

    // Arms (thicker white lines)
    graphics.lineStyle(4, 0xffffff, 1);
    graphics.beginPath();
    graphics.moveTo(32, 32);
    graphics.lineTo(18, 38);
    graphics.strokePath();

    graphics.beginPath();
    graphics.moveTo(32, 32);
    graphics.lineTo(46, 38);
    graphics.strokePath();

    // Head (larger white circle)
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(32, 16, 8);

    // Draw to render texture
    graphics.generateTexture(key, w, h);
    graphics.destroy();

    return key;
  }

  private makeSnowTexture(): string {
    const key = "snow-bg";
    if (this.textures.exists(key)) return key;

    const w = 256;
    const h = 256;
    const rt = this.make.renderTexture({ width: w, height: h }, false);

    rt.fill(0x0b1020, 1);

    for (let i = 0; i < 220; i++) {
      const x = Phaser.Math.Between(0, w - 1);
      const y = Phaser.Math.Between(0, h - 1);
      const a = Phaser.Math.FloatBetween(0.08, 0.35);
      rt.fill(0xffffff, a, x, y, 2, 2);
    }

    rt.fill(0x1f2937, 0.35, 0, 170, w, 86);

    rt.saveTexture(key);
    rt.destroy();

    return key;
  }
}
