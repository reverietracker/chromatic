import { Component } from 'catwalk-ui';
import { NOTES_BY_NUM, MAX_NOTE_NUM } from '../engines/chromatic/defs';

class Grid {
    constructor(columnCount, rowCount) {
        this.columnCount = columnCount;
        this.rowCount = rowCount;
        this.keyDown = null;
        this.keyUp = null;
        this.activeRowIndex = null;

        this.cursorRow = null;
        this.cursorCol = null;
        this.selectionRange = null;
        this.shiftClickPending = false;

        this.node = (
            <table className="pattern-grid">
            </table>
        );
        this.cells = [];
        this.rows = [];
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
                cell.addEventListener('mousedown', (e) => {
                    this.mouseDownHandler(i, j, e);
                });
                cell.addEventListener('focus', () => {
                    this.focusHandler(i, j);
                });
                rowCells.push(cell);
            }
            this.cells.push(rowCells);
            const rowNode = (
                <tr>
                    <td class="row-number">{i}</td>
                </tr>
            );
            this.rows.push(rowNode);
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

    mouseDownHandler(row, col, e) {
        if (e.shiftKey) {
            // Prevent the browser's native shift-click text-selection behavior
            // so only our synthetic cell-range selection is visible.
            e.preventDefault();
            if (this.cursorRow !== null) {
                this.selectRange(this.cursorRow, this.cursorCol, row, col);
                this.shiftClickPending = true;
            } else {
                this.clearSelection();
            }
            this.cells[row][col].focus();
        } else {
            this.clearSelection();
        }
    }

    focusHandler(row, col) {
        if (this.shiftClickPending) {
            this.shiftClickPending = false;
            return;
        }
        this.clearSelection();
        this.cursorRow = row;
        this.cursorCol = col;
    }

    // A channel's 5 columns (note, instrument, effect, parameter high/low) are
    // always selected together as a single unit.
    selectRange(row1, col1, row2, col2) {
        this.clearSelection();

        const channel1 = Math.floor(col1 / 5);
        const channel2 = Math.floor(col2 / 5);
        const rowStart = Math.min(row1, row2);
        const rowEnd = Math.max(row1, row2);
        const colStart = Math.min(channel1, channel2) * 5;
        const colEnd = Math.max(channel1, channel2) * 5 + 4;

        this.selectionRange = { rowStart, rowEnd, colStart, colEnd };
        for (let row = rowStart; row <= rowEnd; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                this.cells[row][col].classList.add('selected');
            }
        }
    }

    clearSelection() {
        if (!this.selectionRange) return;
        const { rowStart, rowEnd, colStart, colEnd } = this.selectionRange;
        for (let row = rowStart; row <= rowEnd; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                this.cells[row][col].classList.remove('selected');
            }
        }
        this.selectionRange = null;
    }

    setCell(row, col, value) {
        this.cells[row][col].innerText = value;
    }

    setActiveRow(row) {
        if (this.activeRowIndex !== null) {
            this.rows[this.activeRowIndex].classList.remove('active-row');
        }
        if (row !== null) {
            this.rows[row].classList.add('active-row');
        }
        this.activeRowIndex = row;
    }
}

const formatNote = (note) => {
    return note === 0 ? '---' : NOTES_BY_NUM[note].name;
}
const formatHex = (val) => {
    return val.toString(16).toUpperCase();
}

export class PatternGrid extends Component {
    constructor(audio) {
        super();

        this.audio = audio;
        this.editorState = null;
        this.cells = [];

        this.currentLength = 0;

        this.channelChangeHandlers = [];
        for (let i = 0; i < 4; i++) {
            this.channelChangeHandlers[i] = (row, field, value) => {
                this.changeRowHandler(i, row, field, value);
            }
        };

        this.changeLengthHandler = (newLength) => {
            if (newLength > this.currentLength) {
                for (let i = this.currentLength; i < newLength; i++) {
                    this.grid.rows[i].style.display = '';
                }
            } else {
                for (let i = newLength; i < this.currentLength; i++) {
                    this.grid.rows[i].style.display = 'none';
                }
            }
            this.currentLength = newLength;
        }


        this.noteKeyDownHandlers = {};
        '-zsxdcvgbhnjmq2w3er5t6y7ui'.split('').forEach((key, i) => {
            this.noteKeyDownHandlers[key] = (channelIndex, row) => {
                const noteVal = i + (this.editorState.octave - 1) * 12;
                if (noteVal > MAX_NOTE_NUM) return;
                this.model.channels[channelIndex].setRow(row, 'note', noteVal);
                if (!this.audio.isPlaying) this.playRow(row);
            }
        });
        this.noteKeyDownHandlers['0'] = (channelIndex, row) => {
            this.model.channels[channelIndex].setRow(row, 'note', 0);
        };
        this.instrumentKeyDownHandlers = {};
        '0123456789abcdef'.split('').forEach((key, i) => {
            this.instrumentKeyDownHandlers[key] = (channelIndex, row) => {
                this.model.channels[channelIndex].setRow(row, 'instrument', i);
                if (!this.audio.isPlaying) this.playRow(row);
            }
        });
        this.effectKeyDownHandlers = {};
        '0123456789abcdef'.split('').forEach((key, i) => {
            this.effectKeyDownHandlers[key] = (channelIndex, row) => {
                this.model.channels[channelIndex].setRow(row, 'effect', i);
                if (!this.audio.isPlaying) this.playRow(row);
            }
        });
        this.parameterHighKeyDownHandlers = {};
        '0123456789abcdef'.split('').forEach((key, i) => {
            this.parameterHighKeyDownHandlers[key] = (channelIndex, row) => {
                const oldValue = this.model.channels[channelIndex].rows[row].parameter;
                this.model.channels[channelIndex].setRow(row, 'parameter', i * 16 + (oldValue % 16));
                if (!this.audio.isPlaying) this.playRow(row);
            }
        });
        this.parameterLowKeyDownHandlers = {};
        '0123456789abcdef'.split('').forEach((key, i) => {
            this.parameterLowKeyDownHandlers[key] = (channelIndex, row) => {
                const oldValue = this.model.channels[channelIndex].rows[row].parameter;
                this.model.channels[channelIndex].setRow(row, 'parameter', Math.floor(oldValue / 16) * 16 + i);
                if (!this.audio.isPlaying) this.playRow(row);
            }
        });
        this.isPlayingRow = false;
    }

    trackEditorState(editorState) {
        this.editorState = editorState;
    }

    playRow(rowNumber) {
        this.isPlayingRow = true;
        this.audio.playRow(this.model, rowNumber);
    }
    releaseRow() {
        if (this.isPlayingRow) {
            this.audio.stop();
            this.isPlayingRow = false;
        }
    }

    createNode() {
        this.grid = new Grid(20, 64);
        const tableHeader = this.grid.node.createTHead();
        const headerRow = tableHeader.insertRow();
        this.grid.node.insertBefore(<colgroup><col></col></colgroup>, tableHeader);
        headerRow.insertCell();
        for (let i = 0; i < 4; i++) {
            this.grid.node.insertBefore(<colgroup className="channel"><col></col><col></col><col></col><col></col><col></col></colgroup>, tableHeader);
            const headerCell = headerRow.insertCell();
            headerCell.colSpan = 5;
            headerCell.innerText = `${i + 1}`;
        }


        this.grid.keyDown = (row, col, e) => {
            const channelIndex = Math.floor(col / 5);
            const channelColumn = col % 5;
            if (channelColumn === 0 && e.key in this.noteKeyDownHandlers && !e.repeat) {
                this.noteKeyDownHandlers[e.key](channelIndex, row);
            } else if (channelColumn === 1 && e.key in this.instrumentKeyDownHandlers && !e.repeat) {
                this.instrumentKeyDownHandlers[e.key](channelIndex, row);
            } else if (channelColumn === 2 && e.key in this.effectKeyDownHandlers && !e.repeat) {
                this.effectKeyDownHandlers[e.key](channelIndex, row);
            } else if (channelColumn === 3 && e.key in this.parameterHighKeyDownHandlers && !e.repeat) {
                this.parameterHighKeyDownHandlers[e.key](channelIndex, row);
            } else if (channelColumn === 4 && e.key in this.parameterLowKeyDownHandlers && !e.repeat) {
                this.parameterLowKeyDownHandlers[e.key](channelIndex, row);
            }
        };
        this.grid.keyUp = () => {
            /* TODO: only call releaseRow if the key is actually one that triggered a note */
            this.releaseRow();
        }

        this.audio.on('row', (rowNumber, pattern) => {
            if (this.model === pattern) {
                this.grid.setActiveRow(rowNumber);
            } else {
                this.grid.setActiveRow(null);
            }
        });
        this.audio.on('stop', () => {
            this.grid.setActiveRow(null);
        });

        return this.grid.node;
    }

    changeRowHandler = (channel, row, field, value) => {
        if (field == 'note') {
            this.grid.setCell(row, channel * 5, formatNote(value));
        } else if (field == 'instrument') {
            this.grid.setCell(row, channel * 5 + 1, formatHex(value));
        } else if (field == 'effect') {
            this.grid.setCell(row, channel * 5 + 2, formatHex(value));
        } else if (field == 'parameter') {
            this.grid.setCell(row, channel * 5 + 3, formatHex(Math.floor(value/16)));
            this.grid.setCell(row, channel * 5 + 4, formatHex(value % 16));
        }
    }
    trackModel(model) {
        if (this.model) {
            this.model.removeListener("changeLength", this.changeLengthHandler);
            for (let i = 0; i < 4; i++) {
                this.model.channels[i].removeListener('changeRow', this.channelChangeHandlers[i]);
            }
        }
        super.trackModel(model);
        this.currentLength = model.length;
        this.cells = [];
        for (let i = 0; i < 4; i++) {
            const channel = this.model.channels[i];
            for (let j = 0; j < 64; j++) {
                const row = channel.rows[j];
                this.grid.setCell(j, i * 5, formatNote(row.note));
                this.grid.setCell(j, i * 5 + 1, formatHex(row.instrument));
                this.grid.setCell(j, i * 5 + 2, formatHex(row.effect));
                this.grid.setCell(j, i * 5 + 3, formatHex(Math.floor(row.parameter/16)));
                this.grid.setCell(j, i * 5 + 4, formatHex(row.parameter % 16));
                if (j >= this.model.length) {
                    this.grid.rows[j].style.display = 'none';
                } else {
                    this.grid.rows[j].style.display = '';
                }
            }
            channel.on('changeRow', this.channelChangeHandlers[i]);
        }
        this.model.on("changeLength", this.changeLengthHandler);
    }
}
