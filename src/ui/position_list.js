import { Component } from 'catwalk-ui';

export class PositionList extends Component {
    constructor(options) {
        super(options);
        this.currentLength = 0;
        this.changeLengthHandler = (newLength) => {
            if (newLength > this.currentLength) {
                for (let i = this.currentLength; i < newLength; i++) {
                    this.node.children[i].classList.remove('disabled');
                }
            } else {
                for (let i = newLength; i < this.currentLength; i++) {
                    this.node.children[i].classList.add('disabled');
                }
            }
            this.currentLength = newLength;
        }
        this.enteredNumber = '';
        this.changePositionHandler = (index, newValue) => {
            const li = this.node.children[index];
            li.innerText = newValue;
        };
    }
    createNode() {
        return (
            <ul class="position-list"></ul>
        );
    }
    trackModel(model) {
        if (this.model) {
            this.model.removeListener("changeLength", this.changeLengthHandler);
            this.model.removeListener("changePosition", this.changePositionHandler);
            this.node.innerHTML = '';
        }
        super.trackModel(model);
        this.currentLength = model.length;
        this.model.on("changeLength", this.changeLengthHandler);
        this.model.on("changePosition", this.changePositionHandler);
        for (let i = 0; i < model.positions.length; i++) {
            const li = document.createElement('li');
            li.tabIndex = 0;
            if (i >= model.length) {
                li.classList.add('disabled');
            }
            li.innerText = model.positions[i];
            this.node.appendChild(li);
            li.addEventListener('keydown', (e) => {
                this.keyDownHandler(i, e);
            });
            li.addEventListener('focus', (e) => {
                this.focusHandler(i, e);
            });
        }
    }
    keyDownHandler(index, e) {
        if (e.key === 'ArrowLeft' && index > 0) {
            this.node.children[index - 1].focus();
            e.preventDefault();
        } else if (e.key === 'ArrowRight' && index < this.model.positions.length - 1) {
            this.node.children[index + 1].focus();
            e.preventDefault();
        } else if (e.key >= '0' && e.key <= '9') {
            this.enteredNumber += e.key;
            const newValue = parseInt(this.enteredNumber);
            if (!isNaN(newValue)) {
                this.model.setPosition(index, newValue);
            }
            e.preventDefault();
        } else if (e.key === 'Backspace') {
            this.enteredNumber = this.enteredNumber.slice(0, -1);
            const newValue = parseInt(this.enteredNumber);
            if (!isNaN(newValue)) {
                this.model.setPosition(index, newValue);
            } else {
                this.model.setPosition(index, 0);
            }
            e.preventDefault();
        }
    }
    focusHandler(index, e) {
        this.enteredNumber = '';
    }
}
