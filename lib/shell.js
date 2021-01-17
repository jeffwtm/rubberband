const SSH2Promise = require('ssh2-promise');

class Shell {
    constructor(config, debug) {

        this.debug = debug;

        this.ssh = new SSH2Promise(config);
        this.ssh.on('ssh', function (status, connection, payload) {
            if (status == 'beforeconnect') {
                console.log('Attempting to connect...');
            }
        });

        this.connect = async () => {
            await this.ssh.connect();
            console.log("Connection established");
        };
        this.exec = async (command) => {
            if (this.debug) console.log(command);
            const output = String(await this.ssh.exec(command)).split('\n').join(' ').trim();
            console.log(output);
            return output;
        };
        this.spawn = async (command) => {
            if (this.debug) console.log(command);
            return await new Promise((resolve, reject) => {
                let output = [];
                this.ssh.spawn(command)
                    .then((stream) => {
                        stream.on('data', (data) => {
                            Array.prototype.push.apply(output, String(data).split('\n'));
                            console.log(String(data));
                        })
                            .on('close', () => resolve(output))
                            .on('finish', () => resolve(output))
                            .stderr.on('data', (data) => {
                                Array.prototype.push.apply(output, String(data).split('\n'));
                                console.log(String(data));
                            });
                    });
            });
        };
        this.close = async () => await this.ssh.close();

    }
}

exports.Shell = Shell;