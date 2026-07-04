import { Component } from 'catwalk-ui';

export class Menu extends Component {
    constructor(items) {
        super();
        this.items = items;
    }
    
    createNode() {
        const node = (
            <ul class="menu"></ul>
        );
        for (const item of this.items) {
            const li = document.createElement('li');
            const button = document.createElement('button');
            if (item.label) {
                button.innerText = item.label;
            }
            if (item.action) {
            button.addEventListener('click', () => {
                    item.action();
                });
            }
            li.appendChild(button);
            node.appendChild(li);
        }
        return node;
    }
}
