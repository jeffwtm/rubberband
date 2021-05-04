const SSH2Promise = require('ssh2-promise');
const client = require('scp2');
const { EventEmitter } = require('events');

class Shell {
    constructor(config, debug) {

        this.config = config;
        this.debug = debug;
        this.emitter = new EventEmitter();
        this.emitter.on('output', (data) => console.log(data));

        this.ssh = new SSH2Promise(config);
        this.ssh.on('ssh', (status) => {
            if (status == 'beforeconnect') {
                this.emitter.emit('output', 'Attempting to connect...');
            }
        });

        this.connect = async () => {
            await this.ssh.connect();
            this.emitter.emit('output', "Connection established");
        };
        this.exec = async (command) => {
            if (this.debug) this.emitter.emit('output', command);
            const output = String(await this.ssh.exec(command)).split('\n').join(' ').trim();
            this.emitter.emit('output', output);
            return output;
        };
        this.spawn = async (command) => {
            if (this.debug) this.emitter.emit('output', command);
            return await new Promise((resolve, reject) => {
                let output = [];
                this.ssh.spawn(command)
                    .then((stream) => {
                        stream.on('data', (data) => {
                            Array.prototype.push.apply(output, String(data).split('\n'));
                            this.emitter.emit('output', String(data));
                        })
                        .on('close', () => resolve(output))
                        .on('finish', () => resolve(output))
                        .stderr.on('data', (data) => {
                            Array.prototype.push.apply(output, String(data).split('\n'));
                            this.emitter.emit('output', String(data));
                        });
                    });
            });
        };
        this.download = async (remoteFile, localFile) => {
            if (this.debug) this.emitter.emit('output', `Transferring remote file "${remoteFile}" to local file "${localFile}"...`);
            await new Promise((resolve) => {
                client.scp({ ...this.config, path: remoteFile }, localFile, (err) => {
                    if (err)
                        this.emitter.emit('output', err);
                    else
                        this.emitter.emit('output', 'Completed successfully.');
                    resolve();
                })
            })
        };
        this.upload = async (localFile, remoteFile) => {
            if (this.debug) this.emitter.emit('output', `Transferring local file "${localFile}" to remote file "${remoteFile}"...`);
            await new Promise((resolve) => {
                client.scp(localFile, { ...this.config, path: remoteFile }, (err) => {
                    if (err)
                        this.emitter.emit('output', err);
                    else
                        this.emitter.emit('output', 'Completed successfully.');
                    resolve();
                })
            })
        };
        this.close = async () => await this.ssh.close();

        this.on = this.emitter.on;

    }
}

exports.Shell = Shell;