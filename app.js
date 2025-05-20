import { config } from './js/config.js';
import { createSpinner } from 'nanospinner'
import chalk from 'chalk';
import confirm from '@inquirer/confirm';
import { validateSocket, validateAuth, getDomainsByMask, configureDomains, configureMPGWs, configureFSHs,configureQueueManagers,saveConfiguration,writeProperties } from './js/datapowerOperations.js';
import { simulateLoading } from './js/utilities.js';

const main = async () => {
    const activeDatapowers = [];
    createSpinner(`${config.datapowers.length} Datapowers Configured \n${config.datapowers.map((datapower, index) => {
        if (index === config.datapowers.length - 1) {
            return `  ╘ ${index + 1}. ${chalk.italic(datapower.name)} (${datapower.host}:${datapower.port})`
        }
        return `  ╞ ${index + 1}. ${chalk.italic(datapower.name)} (${datapower.host}:${datapower.port})`
    }).join('\n')
        }`).success();
    for (const datapower of config.datapowers) {
        if (!await validateSocket(datapower) || !await validateAuth(datapower)) {
            continue;
        }
        activeDatapowers.push(datapower);
    }
    if(activeDatapowers.length === 0){
        createSpinner('No active datapowers found').warn();
        process.exit(0);
    }
    createSpinner(`${chalk.underline('Active')} ${chalk.underline('Datapowers')}: ${activeDatapowers.map((datapower) => chalk.italic(datapower.name)).join(', ')}`).success();
    const answer = await confirm({
        message: `You are about to perform the action: ${chalk.bold(chalk.blue(`${config.action}${config?.property&&config.action === 'ChangeProperties' ? ` -> ${config.property} to ${config.value}` : ''}`))}\nObject: ${chalk.bold(config.object)}\nObjectMask: ${chalk.bold(config.objectMask)}\nDatapowers: (${activeDatapowers.map((datapower) => chalk.italic(datapower.name)).join(', ')})\nDomains with mask: ${chalk.bold(config.domainMask)}\nDo you want to continue?`,
    });
    if (!answer || answer === 'n') {
        createSpinner('Operation cancelled').warn();
        process.exit(0);
    }
    const domainMask = config.domainMask;
    let selectedDomains = [];
    for (const datapower of activeDatapowers) {
        const domains = await getDomainsByMask(datapower, domainMask);
        selectedDomains.push(...domains);
    }
    const spinner = createSpinner('Merging domains').start();
    selectedDomains = [...new Set(selectedDomains)]
    await simulateLoading();
    spinner.success({ text: `Merged domains successfully (${chalk.bold(selectedDomains)})` });
    const object = config.object;
    switch (object) {
        case 'Domain':
            await configureDomains(activeDatapowers, selectedDomains);
            break;
        case 'MPGW':
            await configureMPGWs(activeDatapowers, selectedDomains);
            break;
        case 'HTTPFSH':
        case 'HTTPSFSH':
        case 'MQFSH':
        case 'MQ9FSH':
            await configureFSHs(activeDatapowers, selectedDomains, object);
            break;
        case 'QueueManager':
        case 'QueueManager9':
            await configureQueueManagers(activeDatapowers, selectedDomains,object);
            break;
        default:
            console.log('Unknown object');
    }
    await writeProperties();
    createSpinner('Operation completed').success();
    // save the configuration on the datapowers
    if(config.action !== 'Quiesce' && config.action !== 'Unquiesce'&&config.action !== 'ShowProperties')
        await saveConfiguration(activeDatapowers, selectedDomains);
}
main().catch((error) => {
    let errorMessage = `\nError: ${error.message}`;
    createSpinner(errorMessage).error();
    process.exit(1);
})