const SSH2Promise = require('ssh2-promise');
const client = require('scp2');

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
        this.download = async (remoteFile, localFile) => {
            if (this.debug) console.log(`Transferring remote file "${remoteFile}" to local file "${localFile}"...`);
            await new Promise((resolve) => {
                client.scp({ ...this.config, path: remoteFile }, localFile, (err) => {
                    if (err)
                        console.log(err);
                    else
                        console.log('Completed successfully.');
                    resolve();
                })
            })
        };
        this.upload = async (localFile, remoteFile) => {
            if (this.debug) console.log(`Transferring local file "${localFile}" to remote file "${remoteFile}"...`);
            await new Promise((resolve) => {
                client.scp(localFile, { ...this.config, path: remoteFile }, (err) => {
                    if (err)
                        console.log(err);
                    else
                        console.log('Completed successfully.');
                    resolve();
                })
            })
        };
        this.close = async () => await this.ssh.close();

    }
}

exports.Shell = Shell;