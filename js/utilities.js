import 'dotenv/config';


const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

const apiEndpoints = {
    datapower: (datapower) => `https://${datapower.host}:${datapower.port}`,
    domain: (datapower, domainName) => `https://${datapower.host}:${datapower.port}/mgmt/config/default/Domain${domainName ? `/${domainName}` : ''}`,
    actionQueue: (datapower, domainName) => `https://${datapower.host}:${datapower.port}/mgmt/actionqueue/${domainName || 'default'}`,
    mpgw: (datapower, domainName, mpgwName) => `https://${datapower.host}:${datapower.port}/mgmt/config/${domainName}/MultiProtocolGateway${mpgwName ? `/${mpgwName}` : ''}`,
    fsh: (datapower, domainName, fshType,fshName) => `https://${datapower.host}:${datapower.port}/mgmt/config/${domainName}/${fshType}SourceProtocolHandler${fshName ? `/${fshName}` : ''}`,
    queueManager: (datapower, domainName,QMType, queueManagerName) => `https://${datapower.host}:${datapower.port}/mgmt/config/${domainName}/${QMType}${queueManagerName ? `/${queueManagerName}` : ''}`,
}

const simulateLoading = async () => {
    if (process.env.SIMULATELOADING === 'true') {
        await sleep();
    }
}

const stringifyForLog = (value) => {
    if(Array.isArray(value)) value = value.map((val) => JSON.stringify(val))
    else if (typeof value === 'object') value = JSON.stringify(value)
    return value;
}

const debug = process.env.DEBUG === 'true' ? true : false;

export {
    sleep,
    apiEndpoints,
    simulateLoading,
    stringifyForLog,
    debug
};