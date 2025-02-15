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

const formatNote = (note) => {
    return note === 0 ? '---' : notesByNum[note].name;
}
const formatInstrument = (val) => {
    return val.toString(16).toUpperCase();
}

export class PatternGrid extends Component {
    constructor() {
        super();
        this.cells = [];

        this.noteKeyDownHandlers = {};
        '-zsxdcvgbhnjmq2w3er5t6y7ui'.split('').forEach((key, i) => {
            this.noteKeyDownHandlers[key] = (row) => {
                this.model.setRow(row, 'note', i);
            }
        });
        this.noteKeyDownHandlers['0'] = (row) => {
            this.model.setRow(row, 'note', 0);
        };
        this.instrumentKeyDownHandlers = {};
        '0123456789abcdef'.split('').forEach((key, i) => {
            this.instrumentKeyDownHandlers[key] = (row) => {
                this.model.setRow(row, 'instrument', i);
            }
        });
    }
    createNode() {
        const node = (
            <table className="pattern-grid">
            </table>
        );
        return node;
    }
    globalKeyDownHandlers = {
        'ArrowUp': (row, col) => {
            this.cells[(row + this.cells.length - 1) % this.cells.length][col].focus();
        },
        'ArrowDown': (row, col) => {
            this.cells[(row + 1) % this.cells.length][col].focus();
        },
        'ArrowLeft': (row, col) => {
            this.cells[row][(col + this.cells[row].length - 1) % this.cells[row].length].focus();
        },
        'ArrowRight': (row, col) => {
            this.cells[row][(col + 1) % this.cells[row].length].focus();
        },
        'PageUp': (row, col) => {
            this.cells[0][col].focus();
        },
        'PageDown': (row, col) => {
            this.cells[this.cells.length - 1][col].focus();
        }
    }

    keyDown(row, col, e) {
        if (e.key in this.globalKeyDownHandlers) {
            this.globalKeyDownHandlers[e.key](row, col);
            return;
        }

        if (col === 0 && e.key in this.noteKeyDownHandlers) {
            this.noteKeyDownHandlers[e.key](row);
        } else if (col === 1 && e.key in this.instrumentKeyDownHandlers) {
            this.instrumentKeyDownHandlers[e.key](row);
        }
    }
    changeRowHandler = (row, field, value) => {
        if (field == 'note') {
            this.cells[row][0].innerText = formatNote(value);
        } else {
            this.cells[row][1].innerText = formatInstrument(value);
        }
    }
    trackModel(model) {
        if (this.model) {
            this.model.removeListener('changeRow', this.changeRowHandler);
        }
        super.trackModel(model);
        this.node.replaceChildren();
        this.cells = [];
        for (let i = 0; i < this.model.rows.length; i++) {
            const row = this.model.rows[i];
            const rowCells = [
                (
                    <td tabindex="0">
                        {formatNote(row.note)}
                    </td>
                ),
                (
                    <td tabindex="0">
                        {formatInstrument(row.instrument)}
                    </td>
                ),
            ]
            rowCells.map((cell, j) => {
                cell.addEventListener('keydown', (e) => {
                    this.keyDown(i, j, e);
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
        this.model.on("changeRow", this.changeRowHandler);
    }
}
