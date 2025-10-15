#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

/**
 * Usage:
 *   npm install
 *   npm run build    # optional when using ts-node but recommended for production use
 *   node examples/getFollowers.js <username>
 */

const DEFAULT_USERNAME = 'meliawantsutostfu';

const normaliseUsername = (value) => {
    if (!value) {
        return DEFAULT_USERNAME;
    }

    const trimmed = String(value).trim();

    if (!trimmed) {
        return DEFAULT_USERNAME;
    }

    return trimmed.replace(/^@/, '') || DEFAULT_USERNAME;
};

const parseArguments = () => {
    const [, , ...rawArgs] = process.argv;

    let username;
    let profileFile;

    for (let index = 0; index < rawArgs.length; index += 1) {
        const current = rawArgs[index];

        if (!current) {
            continue;
        }

        if (current === '--from-file' || current === '-f') {
            profileFile = rawArgs[index + 1];
            index += 1;
            continue;
        }

        if (current.startsWith('--from-file=')) {
            profileFile = current.split('=')[1];
            continue;
        }

        if (!current.startsWith('-') && !username) {
            username = current;
        }
    }

    return {
        username: normaliseUsername(username),
        profileFile: profileFile ? path.resolve(profileFile) : undefined,
    };
};

const readStatsFromFile = (filePath) => {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(fileContents);

    if (parsed && typeof parsed === 'object' && 'stats' in parsed) {
        return parsed.stats;
    }

    return parsed;
};

const ensureValidStats = (stats) => {
    if (!stats || typeof stats !== 'object') {
        throw new Error('No stats found in the supplied profile data.');
    }

    const { followerCount, followingCount } = stats;

    if (typeof followerCount !== 'number' || typeof followingCount !== 'number') {
        throw new Error('Follower and following counts must be numeric values.');
    }

    return { followerCount, followingCount };
};

const logStats = (username, stats, source) => {
    console.log(`Username: @${username}`);
    console.log(`Source: ${source}`);
    console.log(`Following: ${stats.followingCount}`);
    console.log(`Followers: ${stats.followerCount}`);
};

const extractGetUserProfileInfo = (moduleExports) => {
    if (!moduleExports || typeof moduleExports !== 'object') {
        return undefined;
    }

    const direct = moduleExports.getUserProfileInfo;
    if (typeof direct === 'function') {
        return direct;
    }

    const defaultExport = moduleExports.default;
    if (typeof defaultExport === 'function') {
        return defaultExport;
    }

    if (defaultExport && typeof defaultExport === 'object' && typeof defaultExport.getUserProfileInfo === 'function') {
        return defaultExport.getUserProfileInfo;
    }

    return undefined;
};

const loadGetUserProfileInfo = async () => {
    const attempts = [
        () => require('..'),
        () => require('../build/index.js'),
        () => {
            try {
                require('ts-node/register/transpile-only');
            } catch (error) {
                const message =
                    error instanceof Error && /Cannot find module/.test(error.message)
                        ? 'ts-node is not installed. Run `npm install` first.'
                        : undefined;
                throw new Error(message || `Unable to register ts-node: ${error}`);
            }

            return require('../src/index.ts');
        },
    ];

    const errors = [];

    for (const attempt of attempts) {
        try {
            const moduleExports = await attempt();
            const getUserProfileInfo = extractGetUserProfileInfo(moduleExports);

            if (!getUserProfileInfo) {
                throw new Error('Module does not expose `getUserProfileInfo`.');
            }

            return getUserProfileInfo;
        } catch (error) {
            errors.push(error instanceof Error ? error.message : String(error));
        }
    }

    const combined = errors.map((message, index) => `Attempt ${index + 1}: ${message}`).join('\n');

    throw new Error(
        `Unable to load the TikTok scraper library. ${combined}\n` +
            'Run `npm install`, then either `npm run build` or rely on ts-node, or provide follower data with `--from-file <path>`.'
    );
};

const fetchStatsFromApi = async (username) => {
    const getUserProfileInfo = await loadGetUserProfileInfo();
    const profileInfo = await getUserProfileInfo(username);
    return ensureValidStats(profileInfo && profileInfo.stats);
};

const main = async () => {
    const { username, profileFile } = parseArguments();

    try {
        if (profileFile) {
            const stats = ensureValidStats(readStatsFromFile(profileFile));
            logStats(username, stats, `local file (${profileFile})`);
            return;
        }

        const stats = await fetchStatsFromApi(username);
        logStats(username, stats, 'TikTok API');
    } catch (error) {
        console.error(`Failed to resolve follower information for @${username}:`, error);
        process.exitCode = 1;
    }
};

main();
