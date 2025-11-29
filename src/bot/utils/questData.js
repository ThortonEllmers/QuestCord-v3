const questTemplates = {
    combat: [
        {
            name: 'Monster Slayer',
            description: 'Defeat monsters in the wilderness',
            difficulty: 'easy',
            rewardCurrency: 19,
            rewardGems: 1
        },
        {
            name: 'Dragon Hunter',
            description: 'Hunt down and defeat a fierce dragon',
            difficulty: 'hard',
            rewardCurrency: 63,
            rewardGems: 3
        },
        {
            name: 'Goblin Exterminator',
            description: 'Clear out a goblin camp',
            difficulty: 'medium',
            rewardCurrency: 38,
            rewardGems: 1
        },
        {
            name: 'Undead Purge',
            description: 'Cleanse the cemetery of undead creatures',
            difficulty: 'medium',
            rewardCurrency: 44,
            rewardGems: 2
        },
        {
            name: 'Beast Tamer',
            description: 'Capture a wild beast for the arena',
            difficulty: 'hard',
            rewardCurrency: 56,
            rewardGems: 2
        }
    ],
    gathering: [
        {
            name: 'Herb Collector',
            description: 'Gather rare herbs from the forest',
            difficulty: 'easy',
            rewardCurrency: 13,
            rewardGems: 1
        },
        {
            name: 'Treasure Hunter',
            description: 'Search for buried treasure',
            difficulty: 'medium',
            rewardCurrency: 31,
            rewardGems: 1
        },
        {
            name: 'Crystal Mining',
            description: 'Mine precious crystals from the caves',
            difficulty: 'medium',
            rewardCurrency: 38,
            rewardGems: 1
        },
        {
            name: 'Ancient Relic Recovery',
            description: 'Recover ancient artifacts from ruins',
            difficulty: 'hard',
            rewardCurrency: 50,
            rewardGems: 2
        },
        {
            name: 'Mushroom Foraging',
            description: 'Collect magical mushrooms from the dark woods',
            difficulty: 'easy',
            rewardCurrency: 15,
            rewardGems: 1
        }
    ],
    exploration: [
        {
            name: 'Cave Explorer',
            description: 'Map out uncharted cave systems',
            difficulty: 'medium',
            rewardCurrency: 35,
            rewardGems: 1
        },
        {
            name: 'Mountain Climber',
            description: 'Reach the summit of the highest peak',
            difficulty: 'hard',
            rewardCurrency: 53,
            rewardGems: 2
        },
        {
            name: 'Ruins Investigation',
            description: 'Investigate mysterious ancient ruins',
            difficulty: 'medium',
            rewardCurrency: 40,
            rewardGems: 1
        },
        {
            name: 'Desert Expedition',
            description: 'Cross the treacherous desert',
            difficulty: 'hard',
            rewardCurrency: 60,
            rewardGems: 2
        },
        {
            name: 'Forest Pathfinder',
            description: 'Chart new paths through dense forest',
            difficulty: 'easy',
            rewardCurrency: 18,
            rewardGems: 1
        }
    ],
    delivery: [
        {
            name: 'Package Delivery',
            description: 'Deliver an important package to a distant town',
            difficulty: 'easy',
            rewardCurrency: 16,
            rewardGems: 1
        },
        {
            name: 'Royal Message',
            description: 'Deliver an urgent message to the king',
            difficulty: 'medium',
            rewardCurrency: 34,
            rewardGems: 1
        },
        {
            name: 'Supply Run',
            description: 'Transport supplies to a remote outpost',
            difficulty: 'medium',
            rewardCurrency: 36,
            rewardGems: 1
        },
        {
            name: 'Contraband Smuggling',
            description: 'Smuggle goods past the city guards',
            difficulty: 'hard',
            rewardCurrency: 69,
            rewardGems: 3
        }
    ],
    social: [
        {
            name: 'Town Meeting',
            description: 'Attend and participate in the town meeting',
            difficulty: 'easy',
            rewardCurrency: 11,
            rewardGems: 1
        },
        {
            name: 'Diplomatic Mission',
            description: 'Negotiate peace between two warring factions',
            difficulty: 'hard',
            rewardCurrency: 58,
            rewardGems: 2
        },
        {
            name: 'Tavern Stories',
            description: 'Gather information at the local tavern',
            difficulty: 'easy',
            rewardCurrency: 14,
            rewardGems: 1
        },
        {
            name: 'Festival Participation',
            description: 'Help organize and participate in the harvest festival',
            difficulty: 'medium',
            rewardCurrency: 30,
            rewardGems: 1
        }
    ]
};

const bossTemplates = [
    {
        type: 'dragon',
        name: 'Ancient Fire Dragon',
        health: 10000,
        rewardCurrency: 250,
        rewardGems: 13
    },
    {
        type: 'giant',
        name: 'Stone Titan',
        health: 12000,
        rewardCurrency: 275,
        rewardGems: 14
    },
    {
        type: 'demon',
        name: 'Shadow Demon Lord',
        health: 15000,
        rewardCurrency: 313,
        rewardGems: 16
    },
    {
        type: 'hydra',
        name: 'Serpent Hydra',
        health: 13000,
        rewardCurrency: 288,
        rewardGems: 14
    },
    {
        type: 'lich',
        name: 'Death Lord Lich',
        health: 11000,
        rewardCurrency: 263,
        rewardGems: 13
    },
    {
        type: 'kraken',
        name: 'Deep Sea Kraken',
        health: 14000,
        rewardCurrency: 300,
        rewardGems: 15
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
