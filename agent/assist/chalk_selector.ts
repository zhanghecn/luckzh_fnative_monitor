import chalk from "chalk";

export class ChalkSelector {
    chalks = [chalk.cyan, chalk.blue, chalk.yellow, chalk.gray, chalk.green, chalk.magenta]
    chalks_i = 0

    getChalk() {
        if (this.chalks_i >= this.chalks.length) {
            this.chalks_i = 0;
        }
        const i = this.chalks_i;
        this.chalks_i++;
        const chalk = this.chalks[i % this.chalks.length];
        return chalk;
    }

}