//TODO:Test FSHs

import axios from 'axios';
import https from 'https';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';
import { debug, apiEndpoints, simulateLoading, stringifyForLog } from './utilities.js';
import { config } from './config.js';
import fs from 'fs';
import util from 'util';
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const httpConfig = {
    httpsAgent
};
const validateSocket = async (datapower) => {
    let spinnerMessage = `Validating IP:Port ${datapower.host}:${datapower.port}`
    const spinner = createSpinner(spinnerMessage).start();
    if (
        datapower === undefined ||
        datapower === null ||
        datapower.host === undefined ||
        datapower.host === null ||
        datapower.port === undefined ||
        datapower.port === null
    ) {
        spinnerMessage = 'IP:Port is missing';
        if (debug === true) spinnerMessage += `: ${JSON.stringify(datapower)}`;
        spinner.error({ text: spinnerMessage });
        // throw new Error('IP:Port is required');
        return false;
    }
    try {
        const response = await axios.get(apiEndpoints.datapower(datapower), httpConfig);

        await simulateLoading();
        if (!response.status.toString().match(/2\d{2}/)) {
            spinnerMessage = `${chalk.italic(datapower.name)} is ${chalk.bold(chalk.redBright(`Offline`))}`;
            if (debug === true) spinnerMessage += ` statusCode ${response.status})`;
            spinner.error({ text: spinnerMessage });
            // throw new Error(`IP:Port is ${chalk.bold(chalk.redBright(`Offline`))}`);
            return false;
        }
    } catch (error) {
        spinnerMessage = `${chalk.italic(datapower.name)} is ${chalk.bold(chalk.redBright(`Offline`))}`;
        if (debug === true) spinnerMessage += ` {Error: ${error.message}}`;
        spinner.error({ text: spinnerMessage });
        return false;
    }
    spinnerMessage = `${chalk.italic(datapower.name)} is ${chalk.bold(chalk.greenBright(`Online`))}`;
    spinner.success({ text: spinnerMessage });
    return true;
}

const validateAuth = async (datapower) => {
    const auth = { username: datapower.username, password: datapower.password };
    let spinnerMessage = `Validating Authentication for ${datapower.host}:${datapower.port}`;
    const spinner = createSpinner(spinnerMessage).start();
    if (
        datapower === undefined ||
        datapower === null ||
        datapower.username === undefined ||
        datapower.username === null ||
        datapower.password === undefined ||
        datapower.password === null
    ) {
        spinnerMessage = 'Authentication is missing';
        if (debug === true) spinnerMessage += `: ${JSON.stringify(datapower)}`;
        spinner.error({ text: spinnerMessage });
        // throw new Error('Authentication is required');
        return false;
    }
    try {
        const response = await axios.get(apiEndpoints.domain(datapower), { ...httpConfig, auth });
        // console.log({status:response.status});
        await simulateLoading();
        if (!response.status.toString().match(/2\d{2}/)) {
            spinnerMessage = `Authentication ${chalk.bold(chalk.redBright(`Failed`))} for ${chalk.italic(datapower.name)}`;
            if (debug === true) spinnerMessage += ` (statusCode ${response.status})`;
            spinner.error({ text: spinnerMessage });
            // throw new Error('Authentication is not valid');
            return false;
        }
    } catch (error) {
        spinnerMessage = `Authentication ${chalk.bold(chalk.redBright(`Failed`))} for ${chalk.italic(datapower.name)}`;
        if (debug === true) spinnerMessage += ` {Error: ${error.message}}`;
        spinner.error({ text: spinnerMessage });
        return false;
    }
    spinnerMessage = `Authentication ${chalk.bold(chalk.greenBright('Successful'))} for ${chalk.italic(datapower.name)}`;
    spinner.success({ text: spinnerMessage });
    return true;
}

const getDomainsByMask = async (datapower, domainMask) => {
    const auth = {
        username: datapower.username,
        password: datapower.password
    };
    let spinnerMessage = `Getting domains by mask ${chalk.bold(domainMask)}`;
    const spinner = createSpinner(spinnerMessage).start();
    const response = await axios.get(apiEndpoints.domain(datapower), { ...httpConfig, auth });
    await simulateLoading();
    if (!response.status.toString().match(/2\d{2}/)) {
        spinnerMessage = `Error getting domains by mask ${chalk.bold(domainMask)} on ${datapower.name}`;
        if (debug === true) spinnerMessage += ` (statusCode ${response.status})`;
        spinner.error({ text: spinnerMessage });
        return [];
    }
    if (response.data === undefined || response.data === null || !response.data.Domain) {
        spinnerMessage = `No domains found by mask ${chalk.bold(domainMask)} on ${datapower.name}`;
        spinner.error({ text: spinnerMessage });
        return [];
    }
    if (!Array.isArray(response.data.Domain))
        response.data.Domain = [response.data.Domain];
    const domains = response.data.Domain;
    const filteredDomains = domains.filter((domain) => domain.name.match(domainMask)).map((domain) => domain.name).filter((domain) => domain !== 'default');
    if (filteredDomains.length === 0) {
        spinnerMessage = `No domains found by mask ${chalk.bold(domainMask)} on ${datapower.name}`;
        spinner.error({ text: spinnerMessage });
        return [];
    }
    spinnerMessage = `Got domains by mask ${chalk.bold(domainMask)}`;
    spinner.success({ text: spinnerMessage });
    return filteredDomains;
}

const getMPGWsByMask = async (datapower, domain, MPGWMask) => {
    const auth = {
        username: datapower.username,
        password: datapower.password
    };
    let spinnerMessage = `Getting MPGWs by mask ${chalk.bold(MPGWMask)}`;
    const spinner = createSpinner(spinnerMessage).start();
    // console.log({apiEndpoints:apiEndpoints.mpgw(datapower, domain)});
    const response = await axios.get(apiEndpoints.mpgw(datapower, domain), { ...httpConfig, auth });
    await simulateLoading();
    if (!response.status.toString().match(/2\d{2}/)) {
        spinnerMessage = `Error getting MPGWs by mask ${chalk.bold(MPGWMask)} on ${datapower.name} in domain ${domain}`;
        if (debug === true) spinnerMessage += ` (statusCode ${response.status})`;
        spinner.error({ text: spinnerMessage });
        return [];
    }
    if (response.data === undefined || response.data === null || !response.data.MultiProtocolGateway) {
        spinnerMessage = `No MPGWs found on ${datapower.name} in domain ${domain}`;
        spinner.error({ text: spinnerMessage });
        return [];
    }
    if (!Array.isArray(response.data.MultiProtocolGateway))
        response.data.MultiProtocolGateway = [response.data.MultiProtocolGateway];
    const MPGWs = response.data.MultiProtocolGateway;
    const filteredMPGWs = MPGWs.filter((MPGW) => MPGW.name.match(MPGWMask)).map((MPGW) => MPGW.name);
    if (filteredMPGWs.length === 0) {
        spinnerMessage = `No MPGWs found by mask ${chalk.bold(MPGWMask)} on ${datapower.name} in domain ${domain}`;
        spinner.error({ text: spinnerMessage });
        return [];
    }
    spinnerMessage = `Got MPGWs by mask ${chalk.bold(MPGWMask)}`;
    spinner.success({ text: spinnerMessage });
    return filteredMPGWs;
}


const getFSHsByMask = async (datapower, domain, object, FSHMask) => {
    const auth = {
        username: datapower.username,
        password: datapower.password
    };
    let spinnerMessage = `Getting FSHs by mask ${chalk.bold(FSHMask)}`;
    const spinner = createSpinner(spinnerMessage).start();
    const fshType = object === 'HTTPFSH' ? 'HTTP' : object === 'HTTPSFSH' ? 'HTTPS' : object === 'MQFSH' ? 'MQ' : 'MQv9Plus';
    // console.log({url:apiEndpoints.fsh(datapower, domain,fshType)})
    const response = await axios.get(apiEndpoints.fsh(datapower, domain, fshType), { ...httpConfig, auth });
    await simulateLoading();
    if (!response.status.toString().match(/2\d{2}/)) {
        spinnerMessage = `Error getting FSHs by mask ${chalk.bold(FSHMask)} on ${datapower.name} in domain ${domain}`;
        if (debug === true) spinnerMessage += ` (statusCode ${response.status})`;
        spinner.error({ text: spinnerMessage });
        return { filteredFSHs: [], fshType };
    }
    // console.log({object,response:response.data})
    if (response.data === undefined || response.data === null || !response.data[`${fshType}SourceProtocolHandler`]) {
        spinnerMessage = `No FSHs found by mask ${chalk.bold(FSHMask)} on ${datapower.name} in domain ${domain}`;
        spinner.error({ text: spinnerMessage });
        return { filteredFSHs: [], fshType };
    }
    if (!Array.isArray(response.data[`${fshType}SourceProtocolHandler`]))
        response.data[`${fshType}SourceProtocolHandler`] = [response.data[`${fshType}SourceProtocolHandler`]];
    // console.log({response:response.data[`${fshType}SourceProtocolHandler`]});
    const FSHs = response.data[`${fshType}SourceProtocolHandler`];
    const filteredFSHs = FSHs.filter((FSH) => {
        // console.log({FSH:FSH.name.toString(),FSHMask:FSHMask});
        if (FSH.name.toString().match(FSHMask))
            return FSH
    }).map((FSH) => FSH.name.toString());
    if (filteredFSHs.length === 0) {
        spinnerMessage = `No FSHs found by mask ${chalk.bold(FSHMask)} on ${datapower.name} in domain ${domain}`;
        spinner.error({ text: spinnerMessage });
        return { filteredFSHs: [], fshType };
    }
    spinnerMessage = `Got FSHs by mask ${chalk.bold(FSHMask)}`;
    spinner.success({ text: spinnerMessage });
    return { filteredFSHs, fshType };
}

const configureDomains = async (datapowers, domains) => {
    const action = config.action;
    for (const datapower of datapowers) {
        createSpinner(`Action starting in ${datapower.name} on domains ${domains}`).success();
        for (const domain of domains) {
            const auth = {
                username: datapower.username,
                password: datapower.password
            };
            let actionUrl;
            switch (action) {
                case 'Disable':
                    await changeProperty(apiEndpoints.domain(datapower, domain), auth, 'mAdminState', 'disabled');
                    break;
                case 'Enable':
                    await changeProperty(apiEndpoints.domain(datapower, domain), auth, 'mAdminState', 'enabled');
                    break;
                case 'Quiesce':
                    actionUrl = await triggerAction(apiEndpoints.actionQueue(datapower, domain), datapower.name, auth, 'DomainQuiesce');
                    if (actionUrl === null)
                        return;
                    await validateAction(apiEndpoints.datapower(datapower) + actionUrl, auth);
                    break;
                case 'Unquiesce':
                    actionUrl = await triggerAction(apiEndpoints.actionQueue(datapower, domain), datapower.name, auth, 'DomainUnquiesce');
                    if (actionUrl === null)
                        return;
                    await validateAction(apiEndpoints.datapower(datapower) + actionUrl, auth);
                    break;
                default:
                    createSpinner(`Unknown action ${action} for Domain`).error();
                    return;
            }
        }
    }
}

const configureMPGWs = async (datapowers, domains) => {
    const action = config.action;
    if (config.objectMask === undefined || config.objectMask === null || config.objectMask === '') {
        createSpinner('Object Mask is missing').error();
        return;
    }
    for (const datapower of datapowers) {
        createSpinner(`Action starting in ${datapower.name} on domains ${domains}`).success();
        for (const domain of domains) {
            const auth = {
                username: datapower.username,
                password: datapower.password
            };
            const MPGWs = await getMPGWsByMask(datapower, domain, config.objectMask);
            if (MPGWs.length === 0)
                continue;
            for (const MPGW of MPGWs) {
                let actionUrl;
                switch (action) {
                    case 'Disable':
                        await changeProperty(apiEndpoints.mpgw(datapower, domain, MPGW), auth, 'mAdminState', 'disabled');
                        break;
                    case 'Enable':
                        await changeProperty(apiEndpoints.mpgw(datapower, domain, MPGW), auth, 'mAdminState', 'enabled');
                        break;
                    case 'Quiesce':
                        actionUrl = await triggerAction(apiEndpoints.actionQueue(datapower, domain), datapower.name, auth, 'MPGWQuiesce', MPGW);
                        if (actionUrl === null)
                            return;
                        await validateAction(apiEndpoints.datapower(datapower) + actionUrl, auth);
                        break;
                    case 'Unquiesce':
                        actionUrl = await triggerAction(apiEndpoints.actionQueue(datapower, domain), datapower.name, auth, 'MPGWUnquiesce', MPGW);
                        if (actionUrl === null)
                            return;
                        await validateAction(apiEndpoints.datapower(datapower) + actionUrl, auth);
                        break;
                    case 'ChangeProperties':
                        const property = config.property;
                        const value = config.value;
                        if (property === undefined || property === null || property === '') {
                            createSpinner('Property is missing use properties.json for available properties').error();
                            return;
                        }
                        await changeProperty(apiEndpoints.mpgw(datapower, domain, MPGW), auth, property, value);
                        break;
                    case 'ShowProperties':
                        const propertyName = config.property;
                        await showProperties(apiEndpoints.mpgw(datapower, domain, MPGW), auth, propertyName);
                        break;
                    default:
                        createSpinner(`Unknown action ${action} for MPGW`).error();
                        return;
                }
            }
        }
    }
}

const configureFSHs = async (datapowers, domains, object) => {
    const action = config.action;
    if (config.objectMask === undefined || config.objectMask === null || config.objectMask === '') {
        createSpinner('Object Mask is missing').error();
        return;
    }
    for (const datapower of datapowers) {
        createSpinner(`Action starting in ${datapower.name} on domains ${domains}`).success();
        for (const domain of domains) {
            const auth = {
                username: datapower.username,
                password: datapower.password
            };
            const { filteredFSHs: FSHs, fshType } = await getFSHsByMask(datapower, domain, object, config.objectMask);
            // console.log({FSHs,fshType});
            if (FSHs.length === 0)
                continue;
            for (const FSH of FSHs) {
                let actionUrl;
                switch (action) {
                    case 'Disable':
                        await changeProperty(apiEndpoints.fsh(datapower, domain, fshType, FSH), auth, 'mAdminState', 'disabled');
                        break;
                    case 'Enable':
                        await changeProperty(apiEndpoints.fsh(datapower, domain, fshType, FSH), auth, 'mAdminState', 'enabled');
                        break;
                    case 'Quiesce':
                        actionUrl = await triggerAction(apiEndpoints.actionQueue(datapower, domain), datapower.name, auth, 'FSHQuiesce', FSH);
                        if (actionUrl === null)
                            return;
                        await validateAction(apiEndpoints.datapower(datapower) + actionUrl, auth);
                        break;
                    case 'Unquiesce':
                        actionUrl = await triggerAction(apiEndpoints.actionQueue(datapower, domain), datapower.name, auth, 'FSHUnquiesce', FSH);
                        if (actionUrl === null)
                            return;
                        await validateAction(apiEndpoints.datapower(datapower) + actionUrl, auth);
                        break;
                    case 'ChangeProperties':
                        const property = config.property;
                        const value = config.value;
                        if (property === undefined || property === null || property === '') {
                            createSpinner('Property is missing use properties.json for available properties').error();
                            return;
                        }
                        await changeProperty(apiEndpoints.fsh(datapower, domain, fshType, FSH), auth, property, value);
                        break;
                    case 'ShowProperties':
                        const propertyName = config.property;
                        await showProperties(apiEndpoints.fsh(datapower, domain, fshType, FSH), auth, propertyName);
                        break;
                    default:
                        createSpinner(`Unknown action ${action} for FSH`).error();
                        return;
                }
            }
        }
    }
}
const savedProperties = []
const writeProperties = async () => {
    try {
        const propertiesFile = config.propertiesSaveFile;
        let PropertiesFileSpinner = createSpinner(`Checking for properties file ${chalk.bold(propertiesFile)}`).start();
        showProperties();
        await fs.promises.writeFile(propertiesFile, JSON.stringify(savedProperties, null, 2));
        PropertiesFileSpinner.success({ text: `Properties saved to ${chalk.bold(propertiesFile)}` });
    } catch (error) {
        PropertiesFileSpinner.error({ text: `Failed to save properties to ${chalk.bold(propertiesFile)}` });
    }
}

const showProperties = async (url, auth, property) => {
    const outputProperties = config.propertiesSaveFile;
    let savingPropertiesSpinnerMessage;
    if (outputProperties) {
        savingPropertiesSpinnerMessage = `Saving properties to ${chalk.bold(outputProperties)}...`;
        const savingPropertiesSpinner = createSpinner(savingPropertiesSpinnerMessage).start();
        try {
            const response = await axios.get(url, { ...httpConfig, auth });
            await simulateLoading();
            if (!response.status.toString().match(/2\d\d/)) {
                throw new Error('Invalid status code');
            } 
            const dphost = url.split('https://')[1].split(':')[0];
            const domainName = url.split('/config/')[1].split('/')[0];
            const type = url.split('/config/')[1].split('/')[1];
            const name = url.split('/config/')[1].split('/')[2];
            const properties = response.data[Object.keys(response.data).slice(-1)[0]][property]
            savedProperties.push(`${dphost} ${domainName} ${type} ${name} ${property} ${properties}`);
            savingPropertiesSpinnerMessage = `Properties saved to ${chalk.bold(outputProperties)}`;
            savingPropertiesSpinner.success({ text: savingPropertiesSpinnerMessage });
        } catch (error) {
            savingPropertiesSpinnerMessage = `Failed to save properties to ${chalk.bold(outputProperties)}`;
            if (debug === true) savingPropertiesSpinnerMessage += ` {Error: ${error.message}}`;
            savingPropertiesSpinner.error({
                text: savingPropertiesSpinnerMessage
            });
        }
    }
}



const changeProperty = async (url, auth, property, value) => {
    if (value === undefined || value === null) {
        createSpinner('Value is missing').error();
        return;
    }
    if (value === '?') {
        matchingValues(property);
        return;
    }
    let spinnerMessage = `Changing property...`;
    const spinner = createSpinner(spinnerMessage).start();
    try {
        const response = await axios.put(`${url}/${property}`, { [property]: value }, { ...httpConfig, auth });
        await simulateLoading();
        if (!response.status.toString().match(/2\d\d/)) {
            throw new Error('Invalid status code');
        }
        value = stringifyForLog(value);
        spinnerMessage = `Property ${chalk.bold(chalk.blue(property))} on ${chalk.bold(url.split('/').slice(-1)[0])} ${chalk.bold(chalk.greenBright('changed'))} to ${chalk.bold(chalk.blue(value))}!`;
        if (debug === true) spinnerMessage += ` (statusCode: ${response.status})`;
        spinner.success({ text: spinnerMessage });
        return true;
    } catch (error) {
        value = stringifyForLog(value);
        spinnerMessage = `Property ${chalk.bold(chalk.blue(property))} on ${chalk.bold(url.split('/').slice(-1)[0])} ${chalk.bold(chalk.redBright('failed'))} to change to ${chalk.bold(chalk.blue(value))}!`;
        if (debug === true) spinnerMessage += `Error: ${error.message}`;
        spinner.error({ text: spinnerMessage });
        return false;
    }
}

const matchingValues = (property) => {
    let spinnerMessage = `Matching values for ${chalk.bold(property)} are:`;
    const spinner = createSpinner(`${spinnerMessage}`).start();
    switch (property) {
        case 'name':
            spinnerMessage += `free text`;
            break;
        case 'mAdminState':
            spinnerMessage += `enabled, disabled`;
            break;
        case 'priority':
            spinnerMessage += `Low, Normal, High`;
            break;
        case 'FrontProtocol':
            spinnerMessage += `{value:fshName1}/[{value:fshName1},{value:fshName2}]`;
            break;
        case 'XMLManager':
            spinnerMessage += `xmlManagerName1`;
            break;
    }
    spinner.success({ text: spinnerMessage });
}


const triggerAction = async (url, datapowerName, auth, action, objectName = '') => {
    let actionTriggeredSpinnerMessage = `Triggering action...`;
    const actionTriggeredSpinner = createSpinner(actionTriggeredSpinnerMessage).start();
    let body;
    switch (action) {
        case 'DomainQuiesce':
            body = { "DomainQuiesce": { "name": url.split('/').slice(-1)[0], timeout: 60 } };
            break;
        case 'DomainUnquiesce':
            body = { "DomainUnquiesce": { "name": url.split('/').slice(-1)[0] } };
            break;
        case 'MPGWQuiesce':
            body = { "ServiceQuiesce": { "type": "MultiProtocolGateway", "name": objectName, timeout: 60 } };
            break;
        case 'MPGWUnquiesce':
            body = { "ServiceUnquiesce": { "type": "MultiProtocolGateway", "name": objectName } };
            break;
        case 'FSHQuiesce':
            body = { "ServiceQuiesce": { "type": "SourceProtocolHandler", "name": objectName, timeout: 60 } };
            break;
        case 'FSHUnquiesce':
            body = { "ServiceUnquiesce": { "type": "SourceProtocolHandler", "name": objectName } };
            break;
        case 'QueueManagerQuiesce':
            body = { "ServiceQuiesce": { "type": "QueueManager", "name": objectName, timeout: 60 } };
            break;
        case 'QueueManagerUnquiesce':
            body = { "ServiceUnquiesce": { "type": "QueueManager", "name": objectName } };
            break;
        case 'SaveConfiguration':
            body = { "SaveConfig": {} };
            break;
        default:
            actionTriggeredSpinnerMessage = `Unknown action ${action}`;
            actionTriggeredSpinner.error({ text: actionTriggeredSpinnerMessage });
            return null;
    }
    try {
        const actionTriggeredResponse = await axios.post(url, body, { ...httpConfig, auth });
        await simulateLoading();
        if (!actionTriggeredResponse.status.toString().match(/2\d\d/)) {
            throw new Error('Invalid status code');
        }
        actionTriggeredSpinnerMessage = `Action ${chalk.bold(chalk.blue(action))} triggered on ${chalk.italic(datapowerName)} in domain ${chalk.bold(url.split('/').slice(-1)[0])} ${objectName ? `for ${chalk.bold(objectName)}` : ''}`;
        if (debug === true) actionTriggeredSpinnerMessage += ` (statusCode: ${actionTriggeredResponse.status})`;
        actionTriggeredSpinner.success({ text: actionTriggeredSpinnerMessage });
        actionTriggeredSpinner.clear();
        const actionUrl = actionTriggeredResponse?.data?._links?.location?.href || actionTriggeredResponse.data.SaveConfig
        return actionUrl;
    } catch (error) {
        actionTriggeredSpinnerMessage = `Failed to trigger action ${chalk.bold(action)} on ${datapowerName}`;
        if (debug === true) actionTriggeredSpinnerMessage += ` {Error: ${error.message}}`;
        actionTriggeredSpinner.error({ text: actionTriggeredSpinnerMessage });
        return null;
    }
}


const validateAction = async (actionUrl, auth, secondTry = false) => {
    let actionValidationSpinnerMessage = `Validating action...`;
    const actionValidationSpinner = createSpinner(actionValidationSpinnerMessage).start();
    try {
        const actionValidationResponse = await axios.get(actionUrl, { ...httpConfig, auth });
        await simulateLoading();
        if (!actionValidationResponse.status.toString().match(/2\d\d/)) {
            throw new Error('Invalid status code');
        }
        if (actionValidationResponse.data.status !== 'completed') {
            if (secondTry === false) {
                actionValidationSpinnerMessage = `Action was ${chalk.bold(chalk.yellowBright('Pending'))} trying again...`;
                return validateAction(actionUrl, auth, true);
            }
            actionValidationSpinnerMessage = `Action ${chalk.bold(chalk.redBright('Failed'))} to complete`;
            if (debug === true) actionValidationSpinnerMessage += ` (statusCode: ${actionValidationResponse.status})`;
            actionValidationSpinner.error({ text: actionValidationSpinnerMessage });
            return;
        }
        actionValidationSpinnerMessage = `Action was ${chalk.bold(chalk.greenBright('Successful'))}`;
        if (debug === true) actionValidationSpinnerMessage += ` (statusCode: ${actionValidationResponse.status})`;
        actionValidationSpinner.success({ text: actionValidationSpinnerMessage });
    } catch (error) {
        actionValidationSpinnerMessage = `Action has ${chalk.bold(chalk.redBright('Failed'))}`;
        if (debug === true) actionValidationSpinnerMessage += ` {Error: ${error.message}}`;
        actionValidationSpinner.error({ text: actionValidationSpinnerMessage });
    }
}


const configureQueueManagers = async (datapowers, domains, object) => {
    const action = config.action;
    if (config.objectMask === undefined || config.objectMask === null || config.objectMask === '') {
        createSpinner('Object Mask is missing').error();
        return;
    }
    for (const datapower of datapowers) {
        createSpinner(`Action starting in ${datapower.name} on domains ${domains}`).success();
        for (const domain of domains) {
            const auth = {
                username: datapower.username,
                password: datapower.password
            };
            const { filteredQueueManagers: QueueManagers, QMType } = await getQueueManagersByMask(datapower, domain, object, config.objectMask);
            console.log({ QueueManagers, QMType })
            if (QueueManagers.length === 0)
                continue;
            for (const QueueManager of QueueManagers) {
                let actionUrl;
                switch (action) {
                    case 'Disable':
                        await changeProperty(apiEndpoints.queueManager(datapower, domain, QMType, QueueManager), auth, 'mAdminState', 'disabled');
                        break;
                    case 'Enable':
                        await changeProperty(apiEndpoints.queueManager(datapower, domain, QMType, QueueManager), auth, 'mAdminState', 'enabled');
                        break;
                    case 'Quiesce':
                        actionUrl = await triggerAction(apiEndpoints.actionQueue(datapower, domain), datapower.name, auth, 'QueueManagerQuiesce', QueueManager);
                        if (actionUrl === null)
                            return;
                        await validateAction(apiEndpoints.datapower(datapower) + actionUrl, auth);
                        break;
                    case 'Unquiesce':
                        actionUrl = await triggerAction(apiEndpoints.actionQueue(datapower, domain), datapower.name, auth, 'QueueManagerUnquiesce', QueueManager);
                        if (actionUrl === null)
                            return;
                        await validateAction(apiEndpoints.datapower(datapower) + actionUrl, auth);
                        break;
                    case 'ChangeProperties':
                        const property = config.property;
                        const value = config.value;
                        if (property === undefined || property === null || property === '') {
                            createSpinner('Property is missing use properties.json for available properties').error();
                            return;
                        }
                        await changeProperty(apiEndpoints.queueManager(datapower, domain, QMType, QueueManager), auth, property, value);
                        break;
                    case 'ShowProperties':
                        const propertyName = config.property;
                        await showProperties(apiEndpoints.queueManager(datapower, domain, QMType, QueueManager), auth, propertyName);
                        break;
                    default:
                        createSpinner(`Unknown action ${action} for QueueManager`).error();
                        return;
                }
            }
        }
    }
}

const getQueueManagersByMask = async (datapower, domain, object, QueueManagerMask) => {
    const auth = {
        username: datapower.username,
        password: datapower.password
    };
    let spinnerMessage = `Getting QueueManagers by mask ${chalk.bold(QueueManagerMask)}`;
    const spinner = createSpinner(spinnerMessage).start();
    const QMType = object === 'QueueManager' ? 'MQQM' : 'MQManager';
    // console.log({QMType})
    // console.log({url:apiEndpoints.queueManager(datapower, domain)})
    const response = await axios.get(apiEndpoints.queueManager(datapower, domain, QMType), { ...httpConfig, auth });
    await simulateLoading();
    if (!response.status.toString().match(/2\d{2}/)) {
        spinnerMessage = `Error getting QueueManagers by mask ${chalk.bold(QueueManagerMask)} on ${datapower.name} in domain ${domain}`;
        if (debug === true) spinnerMessage += ` (statusCode ${response.status})`;
        spinner.error({ text: spinnerMessage });
        return { filteredQueueManagers: [], QMType };
    }
    if (response.data === undefined || response.data === null || !response.data[QMType]) {
        spinnerMessage = `No QueueManagers found ${chalk.bold(QueueManagerMask)} on ${datapower.name} in domain ${domain}`;
        spinner.error({ text: spinnerMessage });
        return { filteredQueueManagers: [], QMType };
    }
    if (!Array.isArray(response.data[QMType]))
        response.data[QMType] = [response.data[QMType]];
    // console.log({response:response.data.MQManager});
    const QueueManagers = response.data[QMType];
    // console.log({QueueManagers})
    const filteredQueueManagers = QueueManagers.filter((QueueManager) => QueueManager.name.match(QueueManagerMask)).map((QueueManager) => QueueManager.name);
    // console.log({filteredQueueManagers})
    if (filteredQueueManagers.length === 0) {
        spinnerMessage = `No QueueManagers found by mask ${chalk.bold(QueueManagerMask)} on ${datapower.name} in domain ${domain}`;
        spinner.error({ text: spinnerMessage });
        return { filteredQueueManagers: [], QMType };
    }
    spinnerMessage = `Got QueueManagers by mask ${chalk.bold(QueueManagerMask)}`;
    spinner.success({ text: spinnerMessage });
    return { filteredQueueManagers, QMType };
}

const saveConfiguration = async (datapowers, domains) => {
    const action = 'Save'
    for (const datapower of datapowers) {
        for (const domain of domains) {
            const auth = {
                username: datapower.username,
                password: datapower.password
            };
            let actionUrl;
            switch (action) {
                case 'Save':
                    actionUrl = await triggerAction(apiEndpoints.actionQueue(datapower, domain), datapower.name, auth, 'SaveConfiguration');
                    if (actionUrl === null)
                        return;
                    createSpinner(`Configuration saved on ${datapower.name} in domain ${domain}`).success();
                    break;
                default:
                    createSpinner(`Unknown action ${action} for SaveConfiguration`).error();
                    return;
            }
        }
    }
}


export {
    validateSocket,
    validateAuth,
    getDomainsByMask,
    configureDomains,
    configureMPGWs,
    configureFSHs,
    configureQueueManagers,
    saveConfiguration,
    writeProperties
};
