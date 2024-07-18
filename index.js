const { Client, GatewayIntentBits, MessageActionRow, MessageButton } = require('discord.js');
const cron = require('node-cron');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages] });

const TOKEN = 'process.env.token';
const SETUP_CHANNEL_ID = '1262171803858636990';
const TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

let setupProcesses = {};

// Mappatura delle combinazioni alle immagini
const setupImages = {
    'Barcellona_GT4_Mercedes-AMG GT4 (2016)': ['img1.png', 'img2.png', 'img3.png', 'img4.png', 'img5.png', 'img6.png'],
    'Zolder_GT3_Honda NSX GT3 (2017)': ['img7.png', 'img8.png', 'img9.png', 'img10.png', 'img11.png', 'img12.png'],
    // Aggiungi altre combinazioni qui
};

// Funzione per pulire i messaggi di un processo
async function cleanupProcess(process) {
    const { messages, userId } = process;
    for (const message of messages) {
        try {
            await message.delete();
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }
    delete setupProcesses[userId];
}

// Funzione per avviare il processo di setup
async function startSetupProcess(message) {
    const userId = message.author.id;

    // Inizia il processo
    setupProcesses[userId] = {
        messages: [message],
        state: 'circuit',
        choices: {},
        timeout: setTimeout(() => {
            if (setupProcesses[userId]) {
                cleanupProcess(setupProcesses[userId]);
            }
        }, TIMEOUT)
    };

    // Chiedi il circuito
    const circuits = [
        'Barcellona', 'Bathurst', 'Brands Hatch', 'Circuit of the Americas', 'Donington Park', 
        'Hungaroring', 'Imola', 'Indianapolis', 'Kyalami', 'Laguna Seca', 'Misano', 
        'Monza', 'Nurburgring', 'Nurburgring 24h', 'Red Bull Ring', 'Ricardo Tormo', 
        'Oulton Park', 'Paul Ricard', 'Silverstone', 'Spa-Francorchamps', 'Snetterton', 
        'Suzuka', 'Watkins Glen', 'Zandvoort', 'Zolder'
    ];

    const rows = circuits.reduce((acc, circuit, index) => {
        if (index % 5 === 0) acc.push(new MessageActionRow());
        acc[acc.length - 1].addComponents(
            new MessageButton().setCustomId(circuit).setLabel(circuit).setStyle('PRIMARY')
        );
        return acc;
    }, []);

    const circuitMessage = await message.channel.send({
        content: 'Seleziona il circuito:',
        components: rows
    });
    setupProcesses[userId].messages.push(circuitMessage);
}

// Gestione del comando !setup
client.on('messageCreate', async (message) => {
    if (message.channel.id !== SETUP_CHANNEL_ID || message.author.bot) return;

    const userId = message.author.id;

    if (message.content === '!setup') {
        // Avvia il processo di setup
        if (setupProcesses[userId]) {
            message.reply({ content: 'Hai già un processo di setup in corso.', ephemeral: true });
        } else {
            await startSetupProcess(message);
        }
    } else if (message.content === '!reset') {
        // Annulla il processo corrente
        if (setupProcesses[userId]) {
            await cleanupProcess(setupProcesses[userId]);
            message.reply({ content: 'Il tuo processo di setup è stato annullato. Puoi iniziare un nuovo processo con il comando !setup.', ephemeral: true });
        } else {
            message.reply({ content: 'Non hai alcun processo di setup in corso.', ephemeral: true });
        }
    } else if (message.content === '!annulla') {
        // Torna indietro di una scelta
        if (setupProcesses[userId]) {
            const process = setupProcesses[userId];
            const lastState = process.state;

            if (lastState === 'category') {
                process.state = 'circuit';
                process.choices = { circuit: process.choices.circuit };
            } else if (lastState === 'car') {
                process.state = 'category';
                process.choices = { circuit: process.choices.circuit, category: process.choices.category };
            }

            // Resend the appropriate message
            await cleanupProcess(process);
            await startSetupProcess(message);
            message.reply({ content: 'Tornato indietro di una scelta. Puoi continuare con il setup.', ephemeral: true });
        } else {
            message.reply({ content: 'Non hai alcun processo di setup in corso.', ephemeral: true });
        }
    }
});

// Gestione delle interazioni con i pulsanti
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const process = setupProcesses[userId];

    if (!process) {
        interaction.reply({ content: 'Non sei tu che hai avviato questo processo.', ephemeral: true });
        return;
    }

    if (process.state === 'circuit') {
        // Circuito selezionato
        process.circuit = interaction.customId;
        process.choices.circuit = process.circuit;
        process.state = 'category';
        clearTimeout(process.timeout);
        process.timeout = setTimeout(() => {
            if (setupProcesses[userId]) {
                cleanupProcess(setupProcesses[userId]);
            }
        }, TIMEOUT);

        const row = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('GT2').setLabel('GT2').setStyle('PRIMARY'),
            new MessageButton().setCustomId('GT3').setLabel('GT3').setStyle('PRIMARY'),
            new MessageButton().setCustomId('GT4').setLabel('GT4').setStyle('PRIMARY')
        );

        const categoryMessage = await interaction.reply({
            content: `Circuito selezionato: ${process.choices.circuit}\nSeleziona la categoria:`,
            components: [row],
            fetchReply: true
        });
        process.messages.push(categoryMessage);
    } else if (process.state === 'category') {
        // Categoria selezionata
        process.category = interaction.customId;
        process.choices.category = process.category;
        process.state = 'car';
        clearTimeout(process.timeout);
        process.timeout = setTimeout(() => {
            if (setupProcesses[userId]) {
                cleanupProcess(setupProcesses[userId]);
            }
        }, TIMEOUT);

        const cars = {
            GT2: ['KTM X-Bow GT2', 'Maserati GT2', 'Audi R8 LMS GT2', 'Mercedes-AMG GT2', 'Porsche 911 GT2 RS CS Evo', 'Porsche 935'],
            GT3: [
                'Ferrari 296 GT3 (2023)', 'Lamborghini Huracan GT3 EVO2 (2023)', 'Porsche 911 (992) GT3 R (2023)', 'Audi R8 LMS Evo II (2022)', 
                'Ferrari 488 Challenge Evo (2020)', 'Lamborghini Huracan ST EVO2 (2021)', 'Porsche 922 GT3 Cup (2021)', 'BMW M2 CS Racing (2020)', 
                'Ferrari 488 GT3 Evo (2020)', 'Mercedes-AMG GT3 (2023)', 'Aston Martin V8 Vantage (2019)', 'Aston Martin V12 Vantage (2013)', 
                'Audi R8 LMS (2015)', 'Audi R8 LMS Evo (2019)', 'Bentley Continental GT3 (2015)', 'Bentley Continental GT3 (2018)', 
                'BMW M4 GT3 (2022)', 'BMW M6 GT3 (2017)', 'Ferrari 488 GT3 (2018)', 'Ford Mustang GT3 Race Car (2024)', 
                'Honda NSX GT3 (2017)', 'Honda NSX GT3 Evo (2019)', 'Jaguar Emil Frey G3 (2012)', 'Lamborghini Huracan GT3 (2015)', 
                'Lamborghini Huracan GT3 Evo (2019)', 'McLaren 720S GT3 EVO (2023)', 'McLaren 720S GT3 (2019)', 'McLaren 650S GT3 (2015)', 
                'Mercedes-AMG GT3 (2015)', 'Nissan GT-R Nismo GT3 (2015)', 'Nissan GT-R Nismo (2018)', 'Porsche 991 GT3 R (2018)', 
                'Porsche 991II GT3 R (2019)', 'Reiter Engineering R-EX GT3 (2017)'
            ],
            GT4: [
                'ALpine A110 GT4 (2018)', 'Aston Martin AMR V8 Vantage GT4 (2018)', 'Audi R8 LMS GT4 (2018)', 'BMW M4 GT4 (2018)', 
                'Chevrolet Camaro GT4.R (2017)', 'Ginetta g55 GT4 (2012)', 'KTM X-Bow GT4 (2016)', 'Maserati Gran Turismo MC GT4 (2016)', 
                'McLaren 570S GT4 (2016)', 'Mercedes-AMG GT4 (2016)', 'Porsche718 Cayman GT4 Clubsport (2019)'
            ]
        };

        const selectedCars = cars[process.category];
        const rows = selectedCars.reduce((acc, car, index) => {
            if (index % 5 === 0) acc.push(new MessageActionRow());
            acc[acc.length - 1].addComponents(
                new MessageButton().setCustomId(car).setLabel(car).setStyle('PRIMARY')
            );
            return acc;
        }, []);

        const carMessage = await interaction.reply({
            content: `Circuito selezionato: ${process.choices.circuit}\nCategoria selezionata: ${process.choices.category}\nSeleziona la macchina:`,
            components: rows,
            fetchReply: true
        });
        process.messages.push(carMessage);
    } else if (process.state === 'car') {
        // Macchina selezionata
        process.car = interaction.customId;
        process.choices.car = process.car;
        clearTimeout(process.timeout);

        // Determina il set di immagini da inviare
        const key = `${process.choices.circuit}_${process.choices.category}_${process.choices.car}`;
        const images = setupImages[key] || [];

        for (const image of images) {
            await interaction.user.send({ files: [image] });
        }

        await interaction.reply({ content: 'Il setup è stato inviato in DM.', ephemeral: true });

        // Pulizia dei messaggi dopo 20 secondi
        setTimeout(() => {
            cleanupProcess(process);
        }, 20000);
    }
});

// Pianificazione della pulizia del canale ogni lunedì alle 01:00
cron.schedule('0 1 * * 1', async () => {
    const channel = await client.channels.fetch(SETUP_CHANNEL_ID);
    const activeProcesses = Object.keys(setupProcesses).length;

    if (activeProcesses === 0) {
        try {
            // Fetch all messages from the channel
            const fetchedMessages = await channel.messages.fetch({ limit: 100 });
            await channel.bulkDelete(fetchedMessages);
            
            // Send message explaining the commands
            await channel.send('Il canale è stato ripulito. Ecco i comandi disponibili:\n\n' +
                '**!setup**: Avvia il processo di setup.\n' +
                '**!reset**: Annulla il processo corrente e ripulisce tutto.\n' +
                '**!annulla**: Torna indietro di una scelta nel processo di setup.');
        } catch (error) {
            console.error('Error cleaning the channel:', error);
        }
    } else {
        console.log('Processi attivi presenti, attendere la fine dei processi per la pulizia.');
    }
});

client.login(TOKEN);
