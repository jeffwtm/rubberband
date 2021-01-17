const rubber = require('gamemaker-rubber');
const config = config_yaml(__dirname + '/config.yml');

(async function(){
        
    for (const project in config.projects) {
        const projectConfig = config.projects[project];
        await rubber.clearCache(projectConfig.projectFile);
        console.log('Cache cleared.');
    }

})();