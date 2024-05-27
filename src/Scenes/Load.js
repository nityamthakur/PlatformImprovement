class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load assets
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");
        this.load.image("tilemap_tiles", "tilemap_packed.png");
        this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");
        this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
        this.load.audio('jump_sound', 'jump_sound.ogg');
        this.load.audio('collect_sound', 'collect_sound.ogg');
        this.load.audio('melt_sound', 'melt_sound.ogg');
        this.load.audio('background_music', 'background_music.ogg');
    }

    create() {
        this.scene.start("CandyRun");
    }
}