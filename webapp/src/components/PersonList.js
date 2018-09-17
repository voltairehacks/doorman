import React, { PureComponent } from 'react';

export default class PersonList extends PureComponent {
  render() {
    return (
      <div className="personList">
        <h2>Known Persons</h2>
        <ul>
            <li>Esteban</li>
        </ul>
      </div>
    );
  }
}
