class CandyRun extends Phaser.Scene {
    constructor() {
        super("CandyRun");
    }

    init() {
        this.ACCELERATION = 1500;
        this.MAX_SPEED = 500;
        this.DRAG = 800;
        this.physics.world.gravity.y = 3000;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.score = 0; // Initialize player score
        this.timer = 180; // Timer for 3 minutes
        this.hasKey = false; // Player's key status
    }

    

    create() {
        // Background music
        this.backgroundMusic = this.sound.add('background_music', { volume: 0.5, loop: true });
        this.backgroundMusic.play();

        this.map = this.add.tilemap("platformer-level-1");
        this.tileset = this.map.addTilesetImage("CandyTiles", "tilemap_tiles");
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({ collides: true });

        // Initialize the score and timer text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setScrollFactor(0);
        this.timerText = this.add.text(16, 48, 'Time: 180', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setScrollFactor(0);

        // Player setup
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Handle collectibles
        this.collectiblesGroup = this.physics.add.group();
        this.map.getObjectLayer('Collectibles').objects.forEach((collectible) => {
            let sprite = this.collectiblesGroup.create(collectible.x, collectible.y - collectible.height, 'tilemap_sheet', 151); // Adjust frame if needed
            sprite.setOrigin(0, 0);
            sprite.setData('type', collectible.properties.find(prop => prop.name === 'type').value);
        });
        this.physics.add.overlap(my.sprite.player, this.collectiblesGroup, this.collectItem, null, this);

        // Handle enemies
        this.enemiesGroup = this.physics.add.group();
        this.map.getObjectLayer('Enemies').objects.forEach((enemy) => {
            let sprite = this.enemiesGroup.create(enemy.x, enemy.y - enemy.height, 'tilemap_sheet', 152); // Adjust frame if needed
            sprite.setOrigin(0, 0);
            sprite.setData('type', enemy.properties.find(prop => prop.name === 'type').value);
            sprite.setData('path', enemy.properties.find(prop => prop.name === 'path').value);
            if (sprite.getData('path') === 'left_right') {
                this.tweens.timeline({
                    targets: sprite.body.velocity,
                    loop: -1,
                    tweens: [
                        { x: 100, y: 0, duration: 1000, ease: 'Stepped' },
                        { x: -100, y: 0, duration: 1000, ease: 'Stepped' }
                    ]
                });
            }
        });
        this.physics.add.collider(my.sprite.player, this.enemiesGroup, this.hitEnemy, null, this);

        // Handle keys
        this.keysGroup = this.physics.add.group();
        this.map.getObjectLayer('Keys').objects.forEach((key) => {
            let sprite = this.keysGroup.create(key.x, key.y - key.height, 'tilemap_sheet', 153); // Adjust frame if needed
            sprite.setOrigin(0, 0);
            sprite.setData('type', key.properties.find(prop => prop.name === 'type').value);
        });
        this.physics.add.overlap(my.sprite.player, this.keysGroup, this.collectKey, null, this);

        // Handle obstacles (Candy Cane)
        this.candyCanesGroup = this.physics.add.group();
        this.map.getObjectLayer('Obstacles').objects.forEach((obstacle) => {
            let sprite = this.candyCanesGroup.create(obstacle.x, obstacle.y - obstacle.height, 'tilemap_sheet', 154); // Adjust frame if needed
            sprite.setOrigin(0, 0);
            sprite.setData('type', obstacle.properties.find(prop => prop.name === 'type').value);
        });
        this.physics.add.collider(my.sprite.player, this.candyCanesGroup, this.checkCandyCane, null, this);

        // Handle water
        this.waterGroup = this.physics.add.group();
        this.map.getObjectLayer('Water').objects.forEach((water) => {
            let sprite = this.waterGroup.create(water.x, water.y - water.height, 'tilemap_sheet', 155); // Adjust frame if needed
            sprite.setOrigin(0, 0);
            sprite.setData('type', water.properties.find(prop => prop.name === 'type').value);
        });
        this.physics.add.collider(my.sprite.player, this.waterGroup, this.hitWater, null, this);

        // Handle moving platforms
        this.movingPlatformsGroup = this.physics.add.group();
        this.map.getObjectLayer('MovingPlatform').objects.forEach((platform) => {
            let sprite = this.movingPlatformsGroup.create(platform.x, platform.y - platform.height, 'tilemap_sheet', 156); // Adjust frame if needed
            sprite.setOrigin(0, 0);
            // Add platform movement logic here (e.g., tween)
            this.tweens.timeline({
                targets: sprite.body.velocity,
                loop: -1,
                tweens: [
                    { x: 100, y: 0, duration: 1000, ease: 'Stepped' },
                    { x: -100, y: 0, duration: 1000, ease: 'Stepped' }
                ]
            });
        });
        this.physics.add.collider(my.sprite.player, this.movingPlatformsGroup);

        // Handle end level
        this.endLevelGroup = this.physics.add.group();
        this.map.getObjectLayer('EndLevel').objects.forEach((end) => {
            let sprite = this.endLevelGroup.create(end.x, end.y - end.height, 'tilemap_sheet', 157); // Adjust frame if needed
            sprite.setOrigin(0, 0);
        });
        this.physics.add.overlap(my.sprite.player, this.endLevelGroup, this.reachEndLevel, null, this);

        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');

        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
        }, this);

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            scale: { start: 0.03, end: 0.1 },
            lifespan: 350,
            alpha: { start: 1, end: 0.1 },
        });
        my.vfx.walking.stop();

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        // Timer event
        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        } else if (cursors.right.isDown) {
        my.sprite.player.setAccelerationX(this.ACCELERATION);
        my.sprite.player.setFlip(true, false);
        my.sprite.player.anims.play('walk', true);
        } else {
        my.sprite.player.setAccelerationX(0);
        my.sprite.player.setDragX(this.DRAG);
        my.sprite.player.anims.play('idle');
        my.vfx.walking.stop();
        }
        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play('jump_sound');
        }
    
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    
        // Check for water collision and respawn
        if (my.sprite.player.y > this.map.heightInPixels - 18) {
            this.playWaterEffect();
            my.sprite.player.setPosition(30, 345);
        }
    }
    
    collectItem(player, item) {
        item.destroy();
        this.collectibleEmitter.explode(10, item.x, item.y);
        if (item.getData('type') === 'ice_cream') {
            this.score += 10;
        } else if (item.getData('type') === 'cherry') {
            this.score += 50;
        }
        this.scoreText.setText('Score: ' + this.score);
        this.sound.play('collect_sound');
    }
    
    hitEnemy(player, enemy) {
        this.gameOver();
    }
    
    collectKey(player, key) {
        key.destroy();
        this.hasKey = true;
        this.sound.play('collect_sound');
    }
    
    checkCandyCane(player, candyCane) {
        if (this.hasKey) {
            candyCane.destroy();
        }
    }
    
    hitWater(player, water) {
        this.gameOver();
    }
    
    reachEndLevel(player, endLevel) {
        // Handle reaching the end of the level
        alert("Level Complete!");
        this.scene.restart();
    }
    
    playWaterEffect() {
        let particles = this.add.particles('kenny-particles');
        let emitter = particles.createEmitter({
            frame: 'bubble_01.png',
            speed: 200,
            lifespan: 500,
            blendMode: 'ADD',
            scale: { start: 0.5, end: 0 },
        });
        emitter.explode(30, my.sprite.player.x, my.sprite.player.y);
        setTimeout(() => particles.destroy(), 500);
    }
    
    updateTimer() {
        this.timer--;
        this.timerText.setText('Time: ' + this.timer);
    
        if (this.timer <= 0) {
            this.gameOver();
        } else if (this.timer <= 10) {
            this.sound.play('melt_sound', { volume: 0.5, loop: true });
        }
    }
    
    gameOver() {
        this.scene.restart();
        this.sound.stopAll();
        alert("Game Over! Mr. Cony melted!");
    }
}