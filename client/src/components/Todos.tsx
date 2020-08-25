import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import { MdCloudUpload, MdDelete } from 'react-icons/md';
import { FaTrash, FaUpload, FaDownload } from 'react-icons/fa';
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createDocument, deleteDocument, getDocuments, patchDocument } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (documentId: string) => {
    this.props.history.push(`/todos/${documentId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createDocument(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
    } catch {
      alert('Document creation failed')
    }
  }

  onTodoDelete = async (documentId: string) => {
    try {
      await deleteDocument(this.props.auth.getIdToken(), documentId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.documentId != documentId)
      })
    } catch {
      alert('Document deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchDocument(this.props.auth.getIdToken(), todo.documentId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Document deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getDocuments(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Document to fetch todos: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Documents</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New document',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="Give a document description..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading Documents
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {this.state.todos.map((todo, pos) => {
          return (
            <Grid.Row key={todo.documentId}>
              {/* <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column> */}
              <Grid.Column width={1} >
              {todo.attachmentUrl && (
                <div>
                  <Button>
                <a href={todo.attachmentUrl} target="_blank"><FaDownload/></a>
                </Button>
                </div>
              )}
              </Grid.Column>
              <Grid.Column width={3} >
              {todo.attachmentUrl && (
                <Image src={todo.attachmentUrl.concat("-preview")}  />
              )}
              </Grid.Column>
              <Grid.Column width={3}>
                <b>{todo.name}</b>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                {todo.ocr}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.documentId)}
                >
                  <FaUpload />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.documentId)}
                >
                  <FaTrash/>
                 
                  
                </Button>
              </Grid.Column>
              {/* <Grid.Column width={16}>
                <Divider />
              </Grid.Column> */}
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
