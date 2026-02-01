#!/usr/bin/env node
/**
 * Skill Creator - Pretty Output Formatter
 *
 * Creates beautiful terminal output for the /skill-create command
 */

// ANSI color codes - no external dependencies
const chalk = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  magenta: (s) => `\x1b[35m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  white: (s) => `\x1b[37m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bgCyan: (s) => `\x1b[46m${s}\x1b[0m`,
};

// Box drawing characters
const BOX = {
  topLeft: '\u256d',
  topRight: '\u256e',
  bottomLeft: '\u2570',
  bottomRight: '\u256f',
  horizontal: '\u2500',
  vertical: '\u2502',
  verticalRight: '\u251c',
  verticalLeft: '\u2524',
};

// Progress spinner frames
const SPINNER = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f'];

// Helper functions
function box(title, content, width = 60) {
  const lines = content.split('\n');
  const top = `${BOX.topLeft}${BOX.horizontal} ${chalk.bold(chalk.cyan(title))} ${BOX.horizontal.repeat(width - title.length - 5)}${BOX.topRight}`;
  const bottom = `${BOX.bottomLeft}${BOX.horizontal.repeat(width - 1)}${BOX.bottomRight}`;
  const middle = lines.map(line => {
    const padding = width - 3 - stripAnsi(line).length;
    return `${BOX.vertical} ${line}${' '.repeat(Math.max(0, padding))} ${BOX.vertical}`;
  }).join('\n');
  return `${top}\n${middle}\n${bottom}`;
}

function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function progressBar(percent, width = 30) {
  const filled = Math.round(width * percent / 100);
  const empty = width - filled;
  const bar = chalk.green('\u2588'.repeat(filled)) + chalk.gray('\u2591'.repeat(empty));
  return `${bar} ${chalk.bold(percent)}%`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function animateProgress(label, steps, callback) {
  process.stdout.write(`\n${chalk.cyan('\u23f3')} ${label}...\n`);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    process.stdout.write(`   ${chalk.gray(SPINNER[i % SPINNER.length])} ${step.name}`);
    await sleep(step.duration || 500);
    process.stdout.clearLine?.(0) || process.stdout.write('\r');
    process.stdout.cursorTo?.(0) || process.stdout.write('\r');
    process.stdout.write(`   ${chalk.green('\u2713')} ${step.name}\n`);
    if (callback) callback(step, i);
  }
}

// Main output formatter
class SkillCreateOutput {
  constructor(repoName, options = {}) {
    this.repoName = repoName;
    this.options = options;
    this.width = options.width || 70;
  }

  header() {
    const subtitle = `Extracting patterns from ${chalk.cyan(this.repoName)}`;

    console.log('\n');
    console.log(chalk.bold(chalk.magenta('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557')));
    console.log(chalk.bold(chalk.magenta('\u2551')) + chalk.bold('  ECC Skill Creator                                              ') + chalk.bold(chalk.magenta('\u2551')));
    console.log(chalk.bold(chalk.magenta('\u2551')) + `     ${subtitle}${' '.repeat(Math.max(0, 55 - stripAnsi(subtitle).length))}` + chalk.bold(chalk.magenta('\u2551')));
    console.log(chalk.bold(chalk.magenta('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d')));
    console.log('');
  }

  async analyzePhase(data) {
    const steps = [
      { name: 'Parsing git history...', duration: 300 },
      { name: `Found ${chalk.yellow(data.commits)} commits`, duration: 200 },
      { name: 'Analyzing commit patterns...', duration: 400 },
      { name: 'Detecting file co-changes...', duration: 300 },
      { name: 'Identifying workflows...', duration: 400 },
      { name: 'Extracting architecture patterns...', duration: 300 },
    ];

    await animateProgress('Analyzing Repository', steps);
  }

  analysisResults(data) {
    console.log('\n');
    console.log(box('Analysis Results', `
${chalk.bold('Commits Analyzed:')} ${chalk.yellow(data.commits)}
${chalk.bold('Time Range:')}       ${chalk.gray(data.timeRange)}
${chalk.bold('Contributors:')}     ${chalk.cyan(data.contributors)}
${chalk.bold('Files Tracked:')}    ${chalk.green(data.files)}
`));
  }

  patterns(patterns) {
    console.log('\n');
    console.log(chalk.bold(chalk.cyan('Key Patterns Discovered:')));
    console.log(chalk.gray('\u2500'.repeat(50)));

    patterns.forEach((pattern, i) => {
      const confidence = pattern.confidence || 0.8;
      const confidenceBar = progressBar(Math.round(confidence * 100), 15);
      console.log(`
  ${chalk.bold(chalk.yellow(`${i + 1}.`))} ${chalk.bold(pattern.name)}
     ${chalk.gray('Trigger:')} ${pattern.trigger}
     ${chalk.gray('Confidence:')} ${confidenceBar}
     ${chalk.dim(pattern.evidence)}`);
    });
  }

  instincts(instincts) {
    console.log('\n');
    console.log(box('Instincts Generated', instincts.map((inst, i) =>
      `${chalk.yellow(`${i + 1}.`)} ${chalk.bold(inst.name)} ${chalk.gray(`(${Math.round(inst.confidence * 100)}%)`)}`
    ).join('\n')));
  }

  output(skillPath, instinctsPath) {
    console.log('\n');
    console.log(chalk.bold(chalk.green('Generation Complete!')));
    console.log(chalk.gray('\u2500'.repeat(50)));
    console.log(`
  ${chalk.green('>')} ${chalk.bold('Skill File:')}
     ${chalk.cyan(skillPath)}

  ${chalk.green('>')} ${chalk.bold('Instincts File:')}
     ${chalk.cyan(instinctsPath)}
`);
  }

  nextSteps() {
    console.log(box('Next Steps', `
${chalk.yellow('1.')} Review the generated SKILL.md
${chalk.yellow('2.')} Import instincts: ${chalk.cyan('/instinct-import <path>')}
${chalk.yellow('3.')} View learned patterns: ${chalk.cyan('/instinct-status')}
${chalk.yellow('4.')} Evolve into skills: ${chalk.cyan('/evolve')}
`));
    console.log('\n');
  }

  footer() {
    console.log(chalk.gray('\u2500'.repeat(60)));
    console.log(chalk.dim(`  Powered by Everything Claude Code`));
    console.log('\n');
  }
}

// Demo function to show the output
async function demo() {
  const output = new SkillCreateOutput('my-hpc-project');

  output.header();

  await output.analyzePhase({
    commits: 200,
  });

  output.analysisResults({
    commits: 200,
    timeRange: 'Nov 2025 - Jan 2026',
    contributors: 4,
    files: 847,
  });

  output.patterns([
    {
      name: 'Conventional Commits',
      trigger: 'when writing commit messages',
      confidence: 0.85,
      evidence: 'Found in 150/200 commits (feat:, fix:, refactor:)',
    },
    {
      name: 'RAII Resource Management',
      trigger: 'when allocating resources',
      confidence: 0.90,
      evidence: 'Observed in core/, solvers/, io/',
    },
    {
      name: 'Cache-Friendly Data Layout',
      trigger: 'when designing data structures',
      confidence: 0.85,
      evidence: 'SoA patterns in particle_system.hpp, mesh.hpp',
    },
    {
      name: 'TDD with Google Test',
      trigger: 'when adding features',
      confidence: 0.75,
      evidence: '42 test files, test(unit) commits common',
    },
  ]);

  output.instincts([
    { name: 'project-conventional-commits', confidence: 0.85 },
    { name: 'project-raii-pattern', confidence: 0.90 },
    { name: 'project-soa-layout', confidence: 0.85 },
    { name: 'project-gtest-location', confidence: 0.90 },
    { name: 'project-cmake-targets', confidence: 0.95 },
    { name: 'project-hot-path-caution', confidence: 0.90 },
  ]);

  output.output(
    '.claude/skills/project-patterns/SKILL.md',
    '.claude/homunculus/instincts/inherited/project-instincts.yaml'
  );

  output.nextSteps();
  output.footer();
}

// Export for use in other scripts
module.exports = { SkillCreateOutput, demo };

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}
