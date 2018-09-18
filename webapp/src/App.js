import React, { Component, PureComponent } from 'react';
import gql from "graphql-tag";
import logo from './logo.svg';
import './App.css';
import { Mutation, Query } from "react-apollo";
import { Table } from 'semantic-ui-react';
import moment from 'moment';

const GET_PERSONS = gql`
{
  allPeople {
    edges {
      node {
        id
        name
        avatar
        email
      }
    }
  }
}
`;

const GET_DEVICES = gql`
{
  allDevices {
    edges {
      node {
        id
        name
        mac
        lastSeen
        lastIp
      }
    }
  }
}
`;

const GET_ASSOCIATIONS = gql`
{
  allPersonDevices {
    edges {
      node {
        id
        person
        device
      }
    }
  }
}
`;

const ADD_PERSON = gql`
mutation CreatePerson($name: String!) {
  createPerson(input: { person: { name: $name } }) {
    person {
      id
      name
    }
  }
}
`;

const ADD_PERSON_DEVICE = gql`
mutation AddPersonDevice($device: Int!, $person: Int!) {
  createPersonDevice(input: { personDevice: { device: $device, person: $person } }) {
    personDevice {
      id
      person
      device
    }
  }
}
`;

const REMOVE_PERSON = gql`
mutation DeletePerson($id: Int!) {
  deletePersonById(input: { id: $id }) {
    deletedPersonId
  }
}
`;

const REMOVE_PERSON_DEVICE = gql`
mutation DeletePersonDevice($id: Int!) {
  deletePersonDeviceById(input: { id: $id }) {
    deletedPersonDeviceId
  }
}
`;

const CHANGE_DEVICE_NAME = gql`
mutation UpdateDevice($id: Int!, $name: String!) {
  updateDeviceById(input: { id: $id, devicePatch: { name: $name } }) {
    device {
      id
      name
      mac
    }
  }
}
`;

const CHANGE_PERSON_NAME = gql`
mutation UpdatePerson($id: Int!, $name: String!) {
  updatePersonById(input: { id: $id, personPatch: { name: $name } }) {
   person {
     id
     name
   }
  }
}
`;


class Associate extends Component {
	render() {
    return <Table.Cell>
      <Mutation mutation={ADD_PERSON_DEVICE} refetchQueries={[{ query: GET_ASSOCIATIONS }]}>
      {(addPersonDevice, { data, loading, error }) => {
        if (loading) return <span>loading...</span>
        if (error) return <div><span>Error:</span> <pre>{error.stack}</pre></div>

        return this.renderCell(addPersonDevice)
      }}
      </Mutation>
    </Table.Cell>
  }
  renderCell(addPersonDevice) {
    const callback = (ev) => {
      addPersonDevice({
        variables: {
          person: parseInt(ev.target.value, 10),
          device: this.props.device.id
        }
      })
    }
    return <form className='ui form'>
        <div className='field'>
          <select onChange={callback}>
            <option value='empty'></option>
            {
              this.props.people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)
            }
          </select>
        </div>
    </form>
  }
}

class Devices extends PureComponent {
  render() {
    return <div className='ui vertical'>
      <div className='ui container stackable middle aligned grid'>
        <h1>Unknown Devices</h1>
        <Table celled structured>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>Name/Hostname</Table.HeaderCell>
                    <Table.HeaderCell>MAC Address</Table.HeaderCell>
                    <Table.HeaderCell>Last IP</Table.HeaderCell>
                    <Table.HeaderCell>Last Seen</Table.HeaderCell>
                    <Table.HeaderCell>Associate</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                this.props.devices.map(device => <Table.Row key={device.id}>
                  <Table.Cell><DeviceName device={device}/></Table.Cell>
                  <Table.Cell>{device.mac}</Table.Cell>
                  <Table.Cell>{device.lastIp}</Table.Cell>
                  <Table.Cell>{ moment(device.lastSeen).fromNow() }</Table.Cell>
                  <Associate device={device} people={this.props.people} />
                </Table.Row>)
              }
            </Table.Body>
        </Table>
      </div>
    </div>
  }
}
const Loading = ({ text }) => <div className='ui vertical left aligned segment'><h2>Loading {text}</h2></div>
const Error = ({ text, error }) => <div className='ui vertical left aligned segment'>
  <div className='ui container'>
    <h2>Error loading {text}</h2>
    <div><pre>{error.stack}</pre></div>
  </div>
</div>

class App extends PureComponent {

  constructor(...parentArgs) {
      super(...parentArgs)
      this.state = { onlyRecent: false }
      this.flip = () => this.setState({ onlyRecent: !this.state.onlyRecent })
  }

  render() {
    return (
      <div>
        <div className="ui inverted vertical center aligned segment">
          <img src={logo} className="App-logo" alt="logo" />
        </div>
        <div className='ui hidden divider' />
        <div className="ui vertical grid">
          <div className='ui container stackable vertical right aligned'>
            <div onClick={this.flip}>
              <label>Only Recent &nbsp;</label>
              <input type='checkbox' checked={this.state.onlyRecent}/>
            </div>
          </div>
        </div>
        <div className='ui hidden divider' />
        <div className='ui hidden divider' />
        { this.renderContent() }
      </div>
    )
  }

  renderContent() {
    return <Query query={GET_PERSONS}>
      {({ loading, error, data }) => {
        if (loading) return <Loading text='people' />
        if (error || ! data) return <Error text='people' error={error} />
        const people = data.allPeople.edges.map(person => person.node)

        return <Query query={GET_DEVICES}>
          {({ loading, error, data }) => {
            if (loading) return <Loading text='known devices' />
            if (error) return <Error text='known devices' error={error} />
            const now = new Date().getTime()
            const devices = data.allDevices.edges.map(node => node.node).filter(
              device => !this.state.onlyRecent || ((now - new Date(device.lastSeen).getTime()) < 120 * 1000)
            )
            const deviceInfo = {}
            for (let device of devices) {
              deviceInfo[device.id] = device
            }

            return <Query query={GET_ASSOCIATIONS}>
              {({ loading, error, data }) => {
                if (loading) return <Loading text='mapped device information' />
                if (error) return <Error text='mapped device information' error={error} />
                const peopleDevices = data.allPersonDevices.edges.map(node => node.node)
                const deviceMap = {}
                const deviceList = {}
                for (let peopleDevice of peopleDevices) {
                  if (deviceInfo[peopleDevice.device]) {
                    deviceMap[peopleDevice.device] = peopleDevice.person
                    deviceList[peopleDevice.person] = deviceList[peopleDevice.person] || []
                    deviceList[peopleDevice.person].push({ ...deviceInfo[peopleDevice.device], peopleDeviceId: peopleDevice.id })
                  }
                }

                return (
                  <div id='internal'>
                    <PeopleDevices people={people} deviceList={deviceList} peopleDevices={peopleDevices} onlyRecent={this.state.onlyRecent}/>
                    <div className='ui hidden divider' />
                    <div className='ui hidden divider' />
                    <Devices devices={devices.filter(device => !deviceMap[device.id])} people={people}/>
                  </div>
                )
              }}
            </Query>
          }}
        </Query>
      }}
    </Query>
  }
}

class RemovePerson extends Component {
    render() {
      return <Mutation mutation={REMOVE_PERSON} update={(cache, data) => {
        const associations = cache.readQuery({ query: GET_PERSONS })
        const deletedPersonId = JSON.parse(atob(data.data.deletePersonById.deletedPersonId))[1]
        cache.writeQuery({
          query: GET_PERSONS,
          data: {
            ...associations,
            allPeople: {
              ...associations.allPeople,
              edges: associations.allPeople.edges.filter(edge => edge.node.id != deletedPersonId)
            }
          }
        })
      }}>
      {(deletePerson, { data, loading, error }) => {
        if (loading) return <span>loading...</span>
        if (error) return <div><span>Error:</span> <pre>{error.stack}</pre></div>

        return this.renderTag(deletePerson)
      }}
    </Mutation>
  }
  renderTag(deletePerson) {
    const callback = (ev) => {
      deletePerson({
        variables: {
          id: this.props.id
        }
      })
    }
    return <button role='button' onClick={callback}>delete</button>
  }
}


class Ungroup extends Component {
    render() {
      return <Mutation mutation={REMOVE_PERSON_DEVICE} refetchQueries={[{ query: GET_ASSOCIATIONS }]} >
      {(deletePersonDevice, { data, loading, error }) => {
        if (loading) return <span>loading...</span>
        if (error) return <div><span>Error:</span> <pre>{error.stack}</pre></div>

        return this.renderTag(deletePersonDevice)
      }}
    </Mutation>
  }
  renderTag(deletePersonDevice) {
    const callback = (ev) => {
      deletePersonDevice({
        variables: {
          id: this.props.personDevice
        }
      })
    }
    return <button role='button' onClick={callback}>ungroup</button>
  }
}


class PeopleDevices extends Component {
  personRow(person) {
    const devices = this.props.deviceList[person.id]
    if (!devices || !devices.length) {
      return <Table.Row key={'person-'+person.id}>
        <Table.Cell><PersonName person={person} /> <RemovePerson id={person.id} /></Table.Cell>
        <Table.Cell colSpan={4}>(no linked devices)</Table.Cell>
      </Table.Row>
    }
    return devices.map(
      (device, index) => {
        return <Table.Row key={device.id}>
            { index == 0 ? <Table.Cell rowSpan={devices.length}><PersonName person={person} /> </Table.Cell> : '' }
            <Table.Cell><DeviceName device={device}/> <Ungroup personDevice={device.peopleDeviceId} /></Table.Cell>
            <Table.Cell>{ device.mac }</Table.Cell>
            <Table.Cell>{ device.lastIp }</Table.Cell>
            <Table.Cell>{ moment(device.lastSeen).fromNow() }</Table.Cell>
          </Table.Row>
      }
    )
  }
  render() {
    return <div className='ui container stackable middle aligned grid'>
      <h1>Current Status</h1>
      <Table celled structured>
        <Table.Header>
            <Table.Row>
                <Table.HeaderCell rowSpan='2'>Name</Table.HeaderCell>
                <Table.HeaderCell colSpan='4'>Devices</Table.HeaderCell>
            </Table.Row>
            <Table.Row>
                <Table.HeaderCell>Name/Hostname</Table.HeaderCell>
                <Table.HeaderCell>MAC Address</Table.HeaderCell>
                <Table.HeaderCell>Last IP</Table.HeaderCell>
                <Table.HeaderCell>Last Seen</Table.HeaderCell>
            </Table.Row>
        </Table.Header>
        <Table.Body>
          { this.props.people
              .filter(person => !this.props.onlyRecent || this.props.deviceList[person.id])
              .map(person => this.personRow(person))
          }
          <AddPersonRow />
        </Table.Body>
      </Table>
    </div>
  }
}

class DeviceName extends Component {
    constructor(...parentProps) {
        super(...parentProps)
        this.updateName = (ev) => this.setState({ name: ev.target.value })
        this.setEdit = () => this.setState({ edit: true })
        this.state = { edit: false, name: this.props.device.name }
    }

    render() {
      return <Mutation mutation={CHANGE_DEVICE_NAME}>
      {(changeDeviceName, { data, loading, error }) => {
        if (loading) return <span>loading...</span>
        if (error) return <div><span>Error:</span> <pre>{error.stack}</pre></div>

        return this.renderName(changeDeviceName)
      }}
      </Mutation>
    }

    renderName(changeDeviceName) {
      const callback = (ev) => {
        ev.preventDefault()
        const name = this.state.name
        changeDeviceName({ variables: { id: this.props.device.id, name } })
        this.setState({ edit: false })
      }
      return !this.state.edit
         ? <span onClick={this.setEdit}>{this.props.device.name}</span>
         : <form className='ui form' onSubmit={callback}>
              <input placeholder={this.props.device.name} ref='name'
                     autoComplete='off' type='text' name='name'
                     value={this.state.name} onChange={this.updateName} />
           </form>
    }
}

class PersonName extends Component {

    constructor(...parentProps) {
        super(...parentProps)
        this.updateName = (ev) => this.setState({ name: ev.target.value })
        this.setEdit = () => this.setState({ edit: true })
        this.state = { edit: false, name: this.props.person.name }
    }

    render() {
      return <Mutation mutation={CHANGE_PERSON_NAME}>
      {(changePersonName, { data, loading, error }) => {
        if (loading) return <span>loading...</span>
        if (error) return <div><span>Error:</span> <pre>{error.stack}</pre></div>

        return this.renderName(changePersonName)
      }}
      </Mutation>
    }

    renderName(changePersonName) {
      const callback = (ev) => {
        ev.preventDefault()
        const name = this.state.name
        changePersonName({ variables: { id: this.props.person.id, name } })
        this.setState({ edit: false })
      }
      return !this.state.edit
         ? <span onClick={this.setEdit}>{this.props.person.name}</span>
         : <form className='ui form' onSubmit={callback}>
              <input placeholder={this.props.person.name} ref='name'
                     autoComplete='off' type='text' name='name'
                     value={this.state.name} onChange={this.updateName} />
           </form>
    }
}

class AddPersonRow extends Component {
    render() {
      return <Mutation mutation={ADD_PERSON} refetchQueries={[{ query: GET_PERSONS }]}>
      {(addPerson, { data, loading, error }) => {
        if (loading) return <span>loading...</span>
        if (error) return <div><span>Error:</span> <pre>{error.stack}</pre></div>

        return this.renderRow(addPerson)
      }}
      </Mutation>
    }
    renderRow(addPerson) {
      const callback = (ev) => {
        ev.preventDefault()
        const name = ev.target.elements.name.value
        console.log(name)
        addPerson({ variables: { name } })
      }
      return <Table.Row>
          <Table.Cell colSpan='5'>
            <form className='ui form' onSubmit={callback}>
              <div className='inline fields ui vertically padded grid'>
                <label>Add person: </label>
                <div className='ui input'>
                  <input placeholder={"Person's name"} ref='name' autoComplete='off' type='text' name='name'/>
                </div>
                <div className='ui input'>
                  <button className='ui fluid button' role='button'>Add</button>
                </div>
              </div>
            </form>
          </Table.Cell>
        </Table.Row>
    }
}

export default App;
