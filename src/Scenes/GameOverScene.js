class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.score = data.score;
    }

    create() {
        // Set up the display text
        this.add.text(400, 200, 'Game Over', { fontSize: '64px', fill: '#ffffff' }).setOrigin(0.5);
        this.add.text(400, 300, `Your Score: ${this.score}`, { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
        this.add.text(400, 400, 'Press R to Restart', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);

        // Set up the 'R' key to restart the game
        this.input.keyboard.on('keydown-R', () => {
            this.scene.start('platformerScene');
        });
    }
}
