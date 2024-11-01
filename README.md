# mcjava-core-xllifi
NodeJS Module for Minecraft launcher. Split from original module so I can add my things and not be bound to any other maintainers.
<br>

## Avantages :dizzy:
- Auto check & downloading compatible java version
- Support 100% custom minecraft version
- Work with ftp without any zip file, juste drop folder in your ftp
- Auto check & delete file with bad hash & size

# Install Client

## Quick Start :zap:
```npm
git clone https://github.com/luuxis/Selvania-Launcher.git
cd Selvania-Launcher
npm install
npm start
```

## Installation :package:
```npm
npm i minecraft-java-core
```

## Usage :triangular_flag_on_post:
Require library
```javascript
const { Launch, Mojang } = require('minecraft-java-core');
```

## Launch :rocket:
### Options
```javascript
const { Mojang, Launch } = require('minecraft-java-core');
const launch = new Launch();

async function main() {
    let opt = {
        url: 'https://launcher.luuxis.fr/files/?instance=PokeMoonX',
        authenticator: await Mojang.login('Luuxis'),
        timeout: 10000,
        path: './Minecraft',
        instance: 'PokeMoonX',
        version: '1.20.4',
        detached: false,
        intelEnabledMac: true,
        downloadFileMultiple: 30,

        loader: {
            path: '',
            type: 'forge',
            build: 'latest',
            enable: true
        },

        verify: true,
        ignored: [
            'config',
            'essential',
            'logs',
            'resourcepacks',
            'saves',
            'screenshots',
            'shaderpacks',
            'W-OVERFLOW',
            'options.txt',
            'optionsof.txt'
        ],

        JVM_ARGS: [],
        GAME_ARGS: [],

        java: {
            path: null,
            version: null,
            type: 'jre',
        },

        screen: {
            width: 1500,
            height: 900
        },

        memory: {
            min: '4G',
            max: '6G'
        }
    }

    await launch.Launch(opt);

    launch.on('extract', extract => {
        console.log(extract);
    });

    launch.on('progress', (progress, size, element) => {
        console.log(`Downloading ${element} ${Math.round((progress / size) * 100)}%`);
    });

    launch.on('check', (progress, size, element) => {
        console.log(`Checking ${element} ${Math.round((progress / size) * 100)}%`);
    });

    launch.on('estimated', (time) => {
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time - hours * 3600) / 60);
        let seconds = Math.floor(time - hours * 3600 - minutes * 60);
        console.log(`${hours}h ${minutes}m ${seconds}s`);
    })

    launch.on('speed', (speed) => {
        console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
    })

    launch.on('patch', patch => {
        console.log(patch);
    });

    launch.on('data', (e) => {
        console.log(e);
    })

    launch.on('close', code => {
        console.log(code);
    });

    launch.on('error', err => {
        console.log(err);
    });
}

main()
```
