const launch = require('../index');
const launcher = new launch.launch();


let opts = {
    ignored: [
        "runtime"
    ],
    path: "./minecraft",
    verify: true,
    version: "1.12.2",
    url: "http://uzurion.luuxis.fr/test/",
    custom: false,
    java: false
}

launcher.launch(opts)

launcher.on('progress', (DL, totDL) => {
    console.log(`${(DL / 1067008).toFixed(2)} Mb to ${(totDL / 1067008).toFixed(2)} Mb`);
});

launcher.on('speed', (speed) => {
    console.log(`${(speed / 1067008).toFixed(3)} Mb/s`)
})

launcher.on('launch', () => {
    console.log("[LAUNCH]")
})

launcher.on('close', () => {
    console.log("[CLOSE]")
})