const questTemplates = {
    combat: [
        {
            name: 'Monster Slayer',
            description: 'Defeat monsters in the wilderness',
            difficulty: 'easy',
            rewardCurrency: 150,
            rewardGems: 5
        },
        {
            name: 'Dragon Hunter',
            description: 'Hunt down and defeat a fierce dragon',
            difficulty: 'hard',
            rewardCurrency: 500,
            rewardGems: 20
        },
        {
            name: 'Goblin Exterminator',
            description: 'Clear out a goblin camp',
            difficulty: 'medium',
            rewardCurrency: 300,
            rewardGems: 10
        },
        {
            name: 'Undead Purge',
            description: 'Cleanse the cemetery of undead creatures',
            difficulty: 'medium',
            rewardCurrency: 350,
            rewardGems: 12
        },
        {
            name: 'Beast Tamer',
            description: 'Capture a wild beast for the arena',
            difficulty: 'hard',
            rewardCurrency: 450,
            rewardGems: 18
        }
    ],
    gathering: [
        {
            name: 'Herb Collector',
            description: 'Gather rare herbs from the forest',
            difficulty: 'easy',
            rewardCurrency: 100,
            rewardGems: 3
        },
        {
            name: 'Treasure Hunter',
            description: 'Search for buried treasure',
            difficulty: 'medium',
            rewardCurrency: 250,
            rewardGems: 8
        },
        {
            name: 'Crystal Mining',
            description: 'Mine precious crystals from the caves',
            difficulty: 'medium',
            rewardCurrency: 300,
            rewardGems: 10
        },
        {
            name: 'Ancient Relic Recovery',
            description: 'Recover ancient artifacts from ruins',
            difficulty: 'hard',
            rewardCurrency: 400,
            rewardGems: 15
        },
        {
            name: 'Mushroom Foraging',
            description: 'Collect magical mushrooms from the dark woods',
            difficulty: 'easy',
            rewardCurrency: 120,
            rewardGems: 4
        }
    ],
    exploration: [
        {
            name: 'Cave Explorer',
            description: 'Map out uncharted cave systems',
            difficulty: 'medium',
            rewardCurrency: 280,
            rewardGems: 9
        },
        {
            name: 'Mountain Climber',
            description: 'Reach the summit of the highest peak',
            difficulty: 'hard',
            rewardCurrency: 420,
            rewardGems: 16
        },
        {
            name: 'Ruins Investigation',
            description: 'Investigate mysterious ancient ruins',
            difficulty: 'medium',
            rewardCurrency: 320,
            rewardGems: 11
        },
        {
            name: 'Desert Expedition',
            description: 'Cross the treacherous desert',
            difficulty: 'hard',
            rewardCurrency: 480,
            rewardGems: 19
        },
        {
            name: 'Forest Pathfinder',
            description: 'Chart new paths through dense forest',
            difficulty: 'easy',
            rewardCurrency: 140,
            rewardGems: 5
        }
    ],
    delivery: [
        {
            name: 'Package Delivery',
            description: 'Deliver an important package to a distant town',
            difficulty: 'easy',
            rewardCurrency: 130,
            rewardGems: 4
        },
        {
            name: 'Royal Message',
            description: 'Deliver an urgent message to the king',
            difficulty: 'medium',
            rewardCurrency: 270,
            rewardGems: 9
        },
        {
            name: 'Supply Run',
            description: 'Transport supplies to a remote outpost',
            difficulty: 'medium',
            rewardCurrency: 290,
            rewardGems: 10
        },
        {
            name: 'Contraband Smuggling',
            description: 'Smuggle goods past the city guards',
            difficulty: 'hard',
            rewardCurrency: 550,
            rewardGems: 21
        }
    ],
    social: [
        {
            name: 'Town Meeting',
            description: 'Attend and participate in the town meeting',
            difficulty: 'easy',
            rewardCurrency: 90,
            rewardGems: 3
        },
        {
            name: 'Diplomatic Mission',
            description: 'Negotiate peace between two warring factions',
            difficulty: 'hard',
            rewardCurrency: 460,
            rewardGems: 17
        },
        {
            name: 'Tavern Stories',
            description: 'Gather information at the local tavern',
            difficulty: 'easy',
            rewardCurrency: 110,
            rewardGems: 4
        },
        {
            name: 'Festival Participation',
            description: 'Help organize and participate in the harvest festival',
            difficulty: 'medium',
            rewardCurrency: 240,
            rewardGems: 8
        }
    ]
};

const bossTemplates = [
    {
        type: 'dragon',
        name: 'Ancient Fire Dragon',
        health: 10000,
        rewardCurrency: 2000,
        rewardGems: 100
    },
    {
        type: 'giant',
        name: 'Stone Titan',
        health: 12000,
        rewardCurrency: 2200,
        rewardGems: 110
    },
    {
        type: 'demon',
        name: 'Shadow Demon Lord',
        health: 15000,
        rewardCurrency: 2500,
        rewardGems: 125
    },
    {
        type: 'hydra',
        name: 'Serpent Hydra',
        health: 13000,
        rewardCurrency: 2300,
        rewardGems: 115
    },
    {
        type: 'lich',
        name: 'Death Lord Lich',
        health: 11000,
        rewardCurrency: 2100,
        rewardGems: 105
    },
    {
        type: 'kraken',
        name: 'Deep Sea Kraken',
        health: 14000,
        rewardCurrency: 2400,
        rewardGems: 120
    }
];

function getRandomQuestsByType(type, count) {
    const templates = questTemplates[type] || [];
    if (templates.length === 0) return [];

    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function getRandomQuests(count) {
    const types = Object.keys(questTemplates);
    const allQuests = [];

    for (const type of types) {
        const quests = questTemplates[type].map(q => ({ ...q, type }));
        allQuests.push(...quests);
    }

    const shuffled = allQuests.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function getRandomBoss() {
    const index = Math.floor(Math.random() * bossTemplates.length);
    return { ...bossTemplates[index] };
}

module.exports = {
    questTemplates,
    bossTemplates,
    getRandomQuestsByType,
    getRandomQuests,
    getRandomBoss
};
