class DeployBase {
    constructor(config) {
        const defaultConfig = {
        }
        
        this.config = Object.assign(defaultConfig, config);
    }

    async preDeploy() {
        //nothing
    }
    
    async deploy() {
        //nothing
    }

    async postDeploy() {
        //nothing
    }
}

module.exports = DeployBase;