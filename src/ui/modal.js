import { Component } from 'catwalk-ui';

export class Modal extends Component {
    constructor() {
        super();
        this.closeButton = <button>Close</button>;
        this.closeButton.addEventListener('click', () => {
            this.close();
        });
    }
    createNode() {
        this.modal = this.createBody();
        this.modal.classList.add("modal-panel");
        const node = (
            <div class="modal-panel-positioner">
                {this.modal}
            </div>
        );
        this.close();
            return node;
    }
    open() {
        this.modal.style.display = 'block';
    }
    close() {
        this.modal.style.display = 'none';
    }
}
