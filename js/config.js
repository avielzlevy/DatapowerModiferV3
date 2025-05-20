const config = {
    //? List of DataPower appliances to connect to
    datapowers: [
        {
            name: "Datapower 1",
            host: "127.0.0.1",
            port: "5554",
            username: "admin",
            password: "admin"
        },
        // {
        //     name: "Datapower 3",
        //     host: "127.0.0.1",
        //     port: "15554",
        //     username: "admin",
        //     password: "123"
        // },
        // {
        //     name: "Datapower 4",
        //     host: "127.0.0.1",
        //     port: "15554",
        //     username: "admin",
        //     password: "admin"
        // }
    ],
    //? a mask to filter the domains to work with    
    domainMask: "Aviel$",
    //? the object to change in the domain ['Domain', 'MPGW', 'FSH', 'QueueManager']
    // object: "Domain",
    // object:"MPGW",
    // object:"HTTPFSH",
    // object:"HTTPSFSH",
    // object:"MQFSH",
    // object:"MQ9FSH",
    // object:"QueueManager",
    object:"QueueManager9",
    //? the object mask to filter the objects to work with (not required for Domain Object)
    objectMask: "test",
    //? the action to perform on the object  ['Disable', 'Enable', 'Quiesce', 'Unquiesce', 'ChangeProperties']
    // action: "Enable",
    // action: "Disable",
    // action: "Quiesce",
    // action: "Unquiesce",
    action: "ChangeProperties",
    action: "ShowProperties",
    propertiesSaveFile: "output_properties.json", //enable to save the current properties to a file
    //? the properties to change in the object
    //? properties names are places in an external file : properties.json
    //? available values can be found in the properties.json file or by passing "?" in the value
    property:"DebugMode",
    value:"on",
};

export { config };