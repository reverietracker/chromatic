import { Component } from 'catwalk-ui';
import { NOTE_NAMES } from '../defs';

class Grid {
    constructor(columnCount, rowCount) {
        this.columnCount = columnCount;
        this.rowCount = rowCount;
        this.keyDown = null;
        this.keyUp = null;

        this.node = (
            <table className="pattern-grid">
            </table>
        );
        this.cells = [];
        for (let i = 0; i < rowCount; i++) {
            const rowCells = [];
            for (let j = 0; j < columnCount; j++) {
                const cell = (
                    <td tabindex="0">
                    </td>
                );
                cell.addEventListener('keydown', (e) => {
                    this.keyDownHandler(i, j, e);
                });
                cell.addEventListener('keyup', (e) => {
                    this.keyUpHandler(i, j, e);
                });
                rowCells.push(cell);
            }
            this.cells.push(rowCells);
            const rowNode = (
                <tr>
                    <td class="row-number">{i}</td>
                </tr>
            );
            rowCells.forEach((cell) => {
                rowNode.appendChild(cell);
            });
            this.node.appendChild(rowNode);
        }
    }

    keyDownHandlers = {
        'ArrowUp': (row, col, e) => {
            this.cells[(row + this.rowCount - 1) % this.rowCount][col].focus();
            e.preventDefault();
        },
        'ArrowDown': (row, col, e) => {
            this.cells[(row + 1) % this.rowCount][col].focus();
            e.preventDefault();
        },
        'ArrowLeft': (row, col, e) => {
            this.cells[row][(col + this.columnCount - 1) % this.columnCount].focus();
            e.preventDefault();
        },
        'ArrowRight': (row, col, e) => {
            this.cells[row][(col + 1) % this.columnCount].focus();
            e.preventDefault();
        },
        'PageUp': (row, col, e) => {
            this.cells[0][col].focus();
            e.preventDefault();
        },
        'PageDown': (row, col, e) => {
            this.cells[this.rowCount - 1][col].focus();
            e.preventDefault();
        }
    }

    keyDownHandler(row, col, e) {
        if (e.key in this.keyDownHandlers) {
            this.keyDownHandlers[e.key](row, col, e);
            return;
        }

        if (this.keyDown) {
            this.keyDown(row, col, e);
        }
    }

    keyUpHandler() {
        if (this.keyUp) {
            this.keyUp();
        }
    }

    setCell(row, col, value) {
        this.cells[row][col].innerText = value;
    }
}

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
    constructor(audio) {
        super();

        this.audio = audio;
        this.cells = [];
        this.lastInstrumentNumber = [1, 1, 1, 1];
        this.positionNumber = 0;

        this.channelChangeHandlers = [];
        for (let i = 0; i < 4; i++) {
            this.channelChangeHandlers[i] = (row, field, value) => {
                this.changeRowHandler(i, row, field, value);
            }
        };

        this.noteKeyDownHandlers = {};
        '-zsxdcvgbhnjmq2w3er5t6y7ui'.split('').forEach((key, i) => {
            this.noteKeyDownHandlers[key] = (channelIndex, row) => {
                const patternNumbers = this.model.positions[this.positionNumber];
                const patternNumber = patternNumbers[channelIndex];
                this.model.patterns[patternNumber].setRow(row, 'note', i);
                this.playRow(row);
            }
        });
        this.noteKeyDownHandlers['0'] = (channelIndex, row) => {
            const patternNumbers = this.model.positions[this.positionNumber];
            const patternNumber = patternNumbers[channelIndex];
            this.model.patterns[patternNumber].setRow(row, 'note', 0);
        };
        this.instrumentKeyDownHandlers = {};
        '0123456789abcdef'.split('').forEach((key, i) => {
            this.instrumentKeyDownHandlers[key] = (channelIndex, row) => {
                const patternNumbers = this.model.positions[this.positionNumber];
                const patternNumber = patternNumbers[channelIndex];
                this.model.patterns[patternNumber].setRow(row, 'instrument', i);
                this.playRow(row);
            }
        });
        this.isPlaying = false;
    }

    playRow(rowNumber) {
        const instrumentCallbacks = [];
        for (let chan = 0; chan < 4; chan++) {
            const patternNumbers = this.model.positions[this.positionNumber];
            const patternNumber = patternNumbers[chan];

            const row = this.model.patterns[patternNumber].rows[rowNumber];
            const note = row.note;
            if (note === 0) {
                instrumentCallbacks[chan] = null;
            } else {
                const frequency = notesByNum[note].frequency;

                const instrumentNumber = row.instrument || this.lastInstrumentNumber[chan];
                this.lastInstrumentNumber[chan] = instrumentNumber;
                const instrument = this.model.instruments[instrumentNumber];

                instrumentCallbacks[chan] = instrument.getFrameCallback(frequency);
            }
        }
        const frameCallback = (frameNumber) => {
            return instrumentCallbacks.map((fn) => fn ? fn(frameNumber) : null);
        };
        this.isPlaying = true;
        this.audio.play(frameCallback);
    }
    releaseRow() {
        if (this.isPlaying) {
            this.audio.stop();
            this.isPlaying = false;
        }
    }

    createNode() {
        this.grid = new Grid(8, 64);
        const tableHeader = this.grid.node.createTHead();
        const headerRow = tableHeader.insertRow();
        this.grid.node.insertBefore(<colgroup><col></col></colgroup>, tableHeader);
        headerRow.insertCell();
        for (let i = 0; i < 4; i++) {
            this.grid.node.insertBefore(<colgroup className="channel"><col></col><col></col></colgroup>, tableHeader);
            const headerCell = headerRow.insertCell();
            headerCell.colSpan = 2;
            headerCell.innerText = `${i + 1}`;
        }


        this.grid.keyDown = (row, col, e) => {
            const channelIndex = Math.floor(col / 2);
            const channelColumn = col % 2;
            if (channelColumn === 0 && e.key in this.noteKeyDownHandlers && !e.repeat) {
                this.noteKeyDownHandlers[e.key](channelIndex, row);
            } else if (channelColumn === 1 && e.key in this.instrumentKeyDownHandlers && !e.repeat) {
                this.instrumentKeyDownHandlers[e.key](channelIndex, row);
            }
        };
        this.grid.keyUp = () => {
            /* TODO: only call releaseRow if the key is actually one that triggered a note */
            this.releaseRow();
        }

        return this.grid.node;
    }

    changeRowHandler = (channel, row, field, value) => {
        if (field == 'note') {
            this.grid.setCell(row, channel * 2, formatNote(value));
        } else {
            this.grid.setCell(row, channel * 2 + 1, formatInstrument(value));
        }
    }
    trackModel(model) {
        if (this.model) {
            const patternNumbers = this.model.positions[this.positionNumber];
            for (let i = 0; i < 4; i++) {
                const patternNumber = patternNumbers[i];
                this.model.patterns[patternNumber].removeListener('changeRow', this.channelChangeHandlers[i]);
            }
        }
        super.trackModel(model);
        this.positionNumber = 0;
        const patternNumbers = this.model.positions[this.positionNumber];
        this.cells = [];
        for (let i = 0; i < 4; i++) {
            const patternNumber = patternNumbers[i];
            const pattern = this.model.patterns[patternNumber];
            for (let j = 0; j < 64; j++) {
                const row = pattern.rows[j];
                this.grid.setCell(j, i * 2, formatNote(row.note));
                this.grid.setCell(j, i * 2 + 1, formatInstrument(row.instrument));
            }
            pattern.on('changeRow', this.channelChangeHandlers[i]);
        }
    }
}
