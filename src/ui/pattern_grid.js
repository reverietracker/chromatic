import { Component } from 'catwalk-ui';
import { NOTE_NAMES } from '../defs';

const notesByNum = {};
for (let oct = 1; oct < 4; oct++) {
    for (let n = 0; n < 12; n++) {
        const noteVal = (oct*12 + n) - 11;
        const noteName = (NOTE_NAMES[n] + '-').substring(0, 2) + oct;
        notesByNum[noteVal] = {
            name: noteName,
            frequency: 440 * 2**((noteVal-22)/12),
        };
    }
}

export class PatternGrid extends Component {
    constructor() {
        super();
        this.cells = [];
    }
    createNode() {
        const node = (
            <table className="pattern-grid">
            </table>
        );
        return node;
    }
    trackModel(model) {
        super.trackModel(model);
        this.node.replaceChildren();
        this.cells = [];
        for (let i = 0; i < this.model.rows.length; i++) {
            const row = this.model.rows[i];
            const rowCells = [
                (
                    <td tabindex="0">
                        {row.note === 0 ? '---' : notesByNum[row.note].name}
                    </td>
                ),
                (
                    <td tabindex="0">
                        {row.instrument}
                    </td>
                ),
            ]
            rowCells.map((cell, j) => {
                cell.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowUp') {
                        this.cells[(i + this.cells.length - 1) % this.cells.length][j].focus();
                    } else if (e.key === 'ArrowDown') {
                        this.cells[(i + 1) % this.cells.length][j].focus();
                    } else if (e.key === 'ArrowLeft') {
                        this.cells[i][(j + rowCells.length - 1) % rowCells.length].focus();
                    } else if (e.key === 'ArrowRight') {
                        this.cells[i][(j + 1) % rowCells.length].focus();
                    } else if (e.key === 'PageUp') {
                        this.cells[0][j].focus();
                    } else if (e.key === 'PageDown') {
                        this.cells[this.cells.length - 1][j].focus();
                    }
                });
            });
            this.cells.push(rowCells);
            const rowNode = (
                <tr>
                    <td class="row-number">{i}</td>
                    {rowCells[0]}
                    {rowCells[1]}
                </tr>
            );
            this.node.appendChild(rowNode);
        }
    }
}
