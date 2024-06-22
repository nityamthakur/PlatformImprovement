class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.score = 0;
        this.hasKey = false;
    }

    create() {
        // Create a new tilemap game object
        this.map = this.make.tilemap({ key: "platformer-level-1" });

        this.add.image(0, 0, 'background').setOrigin(0, 0).setScale(2);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create layers
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({ collides: true });

        // Object layers
        this.objectsLayer = this.map.getObjectLayer("Objects");

        // Spawn player at the defined spawn point
        const spawnPoint = this.objectsLayer.objects.find(obj => obj.name === "player_spawn");
        if (spawnPoint) {
            this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "platformer_characters", "tile_0000.png");
            this.player.setCollideWorldBounds(true);
        }

        // Enable collision between player and ground
        this.physics.add.collider(this.player, this.groundLayer);

        // Setup collectibles
        this.coins = this.addCollectibles("coin", "tilemap_sheet", 151);
        this.diamonds = this.addCollectibles("diamond", "tilemap_sheet", 67);
        this.key = this.addKey("key", "tilemap_sheet", 27);

        // Setup enemies
        this.snowmen = this.addEnemies("snowman", "tilemap_sheet", 145);

        // Setup lock (if any)
        const lockPoint = this.objectsLayer.objects.find(obj => obj.name === "lock");
        if (lockPoint) {
            this.lock = this.physics.add.sprite(lockPoint.x, lockPoint.y, "tilemap_sheet", 28);
            this.physics.add.overlap(this.player, this.lock, this.checkLock, null, this);
        }

        // Setup end level point
        const endLevelPoint = this.objectsLayer.objects.find(obj => obj.name === "level_end");
        if (endLevelPoint) {
            this.endLevelPoint = this.add.rectangle(endLevelPoint.x, endLevelPoint.y, 10, 10, 0xff0000, 0);
            this.physics.add.existing(this.endLevelPoint, true);
            this.physics.add.overlap(this.player, this.endLevelPoint, this.checkLevelEnd, null, this);
        }

        // Setup water
        this.setupWaterTiles();

        // Setup score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setScrollFactor(0);

        // Camera setup
        this.setupCamera();

        // Input setup
        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');

        // Restart game on pressing 'R'
        this.input.keyboard.on('keydown-R', () => this.scene.restart(), this);

        // Particle effects for movement
        this.walkParticles = this.add.particles(0, 0, 'kenny-particles', {
            frame: ['smoke_03.png', 'smoke_09.png'],
            scale: { start: 0.03, end: 0.1 },
            lifespan: 350,
            alpha: { start: 1, end: 0.1 },
            on: false
        });

        this.walkParticles.stop();
    }

    setupWaterTiles() {
        const waterTiles = this.groundLayer.filterTiles(tile => tile.properties && tile.properties.water);
        waterTiles.forEach(tile => {
            const waterTileSprite = this.physics.add.staticImage(tile.getCenterX(), tile.getCenterY(), "tilemap_sheet", tile.index - 1);
            this.physics.add.collider(this.player, waterTileSprite, this.playerDied, null, this);
        });
    }

    addCollectibles(name, key, frame) {
        let collectibles = this.map.createFromObjects("Objects", {
            name: name,
            key: key,
            frame: frame
        });

        this.physics.world.enable(collectibles, Phaser.Physics.Arcade.STATIC_BODY);
        let collectiblesGroup = this.add.group(collectibles);

        collectibles.forEach(collectible => {
            this.physics.add.overlap(this.player, collectible, (player, obj) => {
                if (name === "diamond") {
                    this.updateScore(10);
                } else {
                    this.updateScore(1);
                }
                obj.destroy();
            });
        });

        return collectiblesGroup;
    }

    addKey(name, key, frame) {
        let keys = this.map.createFromObjects("Objects", {
            name: name,
            key: key,
            frame: frame
        });

        this.physics.world.enable(keys, Phaser.Physics.Arcade.STATIC_BODY);
        let keyGroup = this.add.group(keys);

        keys.forEach(key => {
            this.physics.add.overlap(this.player, key, (player, obj) => {
                obj.destroy();
                this.hasKey = true;
                console.log("Key collected");
            });
        });

        return keyGroup;
    }

    checkLock(player, lock) {
        if (this.hasKey) {
            lock.destroy();
            console.log("Lock opened");
        }
    }

    addEnemies(name, key, frame) {
        let enemies = this.map.createFromObjects("Objects", {
            name: name,
            key: key,
            frame: frame
        });

        this.physics.world.enable(enemies, Phaser.Physics.Arcade.DYNAMIC_BODY);
        let enemiesGroup = this.add.group(enemies);

        enemies.forEach(enemy => {
            enemy.body.setBounce(1, 0);
            enemy.body.setCollideWorldBounds(true);
            enemy.body.velocity.x = 100; // Snowman initial movement speed
            this.physics.add.collider(enemy, this.groundLayer);
            this.physics.add.overlap(this.player, enemy, this.playerDied, null, this);
        });

        return enemiesGroup;
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.25, 0.25);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
    }

    update() {
        if (cursors.left.isDown) {
            this.player.setAccelerationX(-this.ACCELERATION);
            this.player.resetFlip();
            this.player.anims.play('walk', true);

            this.walkParticles.startFollow(this.player, this.player.displayWidth / 2 - 10, this.player.displayHeight / 2 - 5, false);
            this.walkParticles.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground
            if (this.player.body.blocked.down) {
                this.walkParticles.start();
            }
        } else if (cursors.right.isDown) {
            this.player.setAccelerationX(this.ACCELERATION);
            this.player.setFlip(true, false);
            this.player.anims.play('walk', true);

            this.walkParticles.startFollow(this.player, this.player.displayWidth / 2 - 10, this.player.displayHeight / 2 - 5, false);
            this.walkParticles.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground
            if (this.player.body.blocked.down) {
                this.walkParticles.start();
            }
        } else {
            // Set acceleration to 0 and have DRAG take over
            this.player.setAccelerationX(0);
            this.player.setDragX(this.DRAG);
            this.player.anims.play('idle');
            this.walkParticles.stop();
        }

        if (!this.player.body.blocked.down) {
            this.player.anims.play('jump');
        }
        if (this.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            this.player.setVelocityY(this.JUMP_VELOCITY);
        }

        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        this.enemiesUpdate();
    }

    enemiesUpdate() {
        this.snowmen.children.each(snowman => {
            if (snowman.body.blocked.right) {
                snowman.body.velocity.x = -100;
                snowman.setFlip(true, false);
            } else if (snowman.body.blocked.left) {
                snowman.body.velocity.x = 100;
                snowman.setFlip(false, false);
            }
        });
    }

    checkLevelEnd(player, endLevel) {
        if (this.hasKey) {
            // Level completed
            this.scene.start('GameOverScene', { score: this.score });
        }
}

playerDied() {
    this.scene.start('GameOverScene', { score: this.score });
}



updateScore(amount) {
    this.score += amount;
    this.scoreText.setText(`Score: ${this.score}`);
}
}