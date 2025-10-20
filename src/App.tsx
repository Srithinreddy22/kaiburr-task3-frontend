import { useEffect, useMemo, useState } from 'react'
import { ConfigProvider, App as AntdApp, theme, Layout, Typography, message, Tag, Empty, Drawer, Badge, Menu, Statistic, Modal, Timeline, Row, Col } from 'antd'
import { Button, Card as AntCard, Form, Input, Table, Tooltip } from 'antd'
import { DeleteOutlined, PlayCircleOutlined, ReloadOutlined, SearchOutlined, PlusOutlined, EyeOutlined, ThunderboltOutlined, AppstoreOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import dayjs from 'dayjs'
import './App.css'

type TaskExecution = {
  startTime: string
  endTime: string
  output: string
}

type Task = {
  id: string
  name: string
  owner: string
  command: string
  taskExecutions?: TaskExecution[]
}

const api = axios.create({ baseURL: '/api' })

function RecentActivity({ tasks }: { tasks: Task[] }) {
  const recentExecutions = useMemo(() => {
    const allExecutions = tasks
      .flatMap(task =>
        (task.taskExecutions || []).map(exec => ({
          ...exec,
          taskName: task.name,
          taskId: task.id,
          taskOwner: task.owner
        }))
      )
      .sort((a, b) => new Date(b.endTime || b.startTime).getTime() - new Date(a.endTime || a.startTime).getTime())
      .slice(0, 10)

    return allExecutions
  }, [tasks])

  return (
    <AntCard title="Recent Activity" className="activity-card">
      <Timeline
        items={recentExecutions.map((exec) => ({
          dot: <CheckCircleOutlined style={{ color: '#10b981' }} />,
          children: (
            <div>
              <Typography.Text strong>{exec.taskName}</Typography.Text>
              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                by {exec.taskOwner}
              </Typography.Text>
              <div style={{ marginTop: 4 }}>
                <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                  {dayjs(exec.endTime || exec.startTime).format('MMM DD, HH:mm')}
                </Typography.Text>
              </div>
              <div style={{ marginTop: 8, background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                <Typography.Text code style={{ fontSize: '12px', color: '#059669' }}>
                  {exec.output?.substring(0, 100)}{exec.output?.length > 100 ? '...' : ''}
                </Typography.Text>
              </div>
            </div>
          )
        }))}
      />
    </AntCard>
  )
}

function TaskStats({ tasks }: { tasks: Task[] }) {
  const stats = useMemo(() => {
    const totalTasks = tasks.length
    const totalExecutions = tasks.reduce((sum, task) => sum + (task.taskExecutions?.length || 0), 0)
    const recentExecutions = tasks.reduce((sum, task) => {
      const recent = task.taskExecutions?.filter(exec =>
        dayjs(exec.endTime || exec.startTime).isAfter(dayjs().subtract(24, 'hours'))
      ).length || 0
      return sum + recent
    }, 0)

    return { totalTasks, totalExecutions, recentExecutions }
  }, [tasks])

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <AntCard className="stat-card">
          <Statistic
            title="Total Tasks"
            value={stats.totalTasks}
            prefix={<AppstoreOutlined style={{ color: '#667eea' }} />}
            valueStyle={{ color: '#667eea' }}
          />
        </AntCard>
      </Col>
      <Col xs={24} sm={8}>
        <AntCard className="stat-card">
          <Statistic
            title="Total Executions"
            value={stats.totalExecutions}
            prefix={<PlayCircleOutlined style={{ color: '#10b981' }} />}
            valueStyle={{ color: '#10b981' }}
          />
        </AntCard>
      </Col>
      <Col xs={24} sm={8}>
        <AntCard className="stat-card">
          <Statistic
            title="Last 24h"
            value={stats.recentExecutions}
            prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
            valueStyle={{ color: '#f59e0b' }}
          />
        </AntCard>
      </Col>
    </Row>
  )
}

function useTasks() {
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<Task[]>('/tasks')
      setTasks(data)
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const searchByName = async (name: string) => {
    setLoading(true)
    try {
      const { data } = await api.get<Task[]>('/tasks/search', { params: { name } })
      setTasks(data)
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setTasks([])
      } else {
        message.error('Search failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const create = async (task: Task) => {
    await api.post<Task>('/tasks', task)
  }

  const remove = async (id: string) => {
    await api.delete(`/tasks/${id}`)
  }

  const run = async (id: string) => {
    const { data } = await api.put<Task>(`/tasks/${id}`)
    return data
  }

  return { tasks, loading, fetchAll, searchByName, create, remove, run, setTasks }
}

function CreateTaskForm({ open, onClose, onCreated }: { open: boolean, onClose: () => void, onCreated: () => void }) {
  const [form] = Form.useForm<Task>()

  const onFinish = async (values: Task) => {
    try {
      await api.post('/tasks', { ...values, taskExecutions: [] })
      message.success('Task created')
      form.resetFields()
      onCreated()
      // Notify listeners to refresh
      window.dispatchEvent(new Event('tasks:refresh'))
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Create failed. Command may be invalid.')
    }
  }

  return (
    <Modal title="Create New Task" open={open} onCancel={onClose} onOk={() => form.submit()} width={600} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="ID" name="id" rules={[{ required: true, message: 'Please enter task ID' }]}>
          <Input placeholder="Unique task ID" allowClear />
        </Form.Item>
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input placeholder="Task name" allowClear />
        </Form.Item>
        <Form.Item label="Owner" name="owner" rules={[{ required: true }]}>
          <Input placeholder="Owner name" allowClear />
        </Form.Item>
        <Form.Item label="Command" name="command" rules={[{ required: true }]} help="Allowed: echo, date, ls, pwd">
          <Input placeholder="echo Hello World!" allowClear className="mono" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function ExecutionsDrawer({ task, open, onClose }: { task?: Task, open: boolean, onClose: () => void }) {
  const executions = task?.taskExecutions ?? []
  return (
    <Drawer title={`Executions — ${task?.name ?? ''}`} width={720} open={open} onClose={onClose} destroyOnClose>
      <Table
        size="small"
        rowKey={(_, i) => `${i}`}
        dataSource={executions}
        pagination={{ pageSize: 5 }}
        columns={[
          { title: 'Start', dataIndex: 'startTime', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
          { title: 'End', dataIndex: 'endTime', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
          { title: 'Output', dataIndex: 'output', render: (v: string) => <div className="table-output"><pre className="mono" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{v}</pre></div> },
        ]}
      />
    </Drawer>
  )
}

function TaskList({ onCreateClick }: { onCreateClick: () => void }) {
  const { tasks, loading, fetchAll, searchByName, remove, run, setTasks } = useTasks()
  const [query, setQuery] = useState('')
  const [viewTask, setViewTask] = useState<Task | undefined>(undefined)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    const handler = () => fetchAll()
    window.addEventListener('tasks:refresh', handler)
    return () => window.removeEventListener('tasks:refresh', handler)
  }, [fetchAll])

  const onSearch = () => {
    if (!query.trim()) fetchAll()
    else searchByName(query)
  }

  const columns: ColumnsType<Task> = useMemo(() => [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 120,
      render: (v: string) => <Typography.Text code style={{ fontSize: '12px' }}>{v}</Typography.Text>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      width: 200,
      render: (v: string) => <Typography.Text strong style={{ color: '#1e293b' }}>{v}</Typography.Text>
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      width: 150,
      render: (v: string) => <Typography.Text style={{ color: '#64748b' }}>{v}</Typography.Text>
    },
    {
      title: 'Command',
      dataIndex: 'command',
      width: 250,
      render: (v: string) => <Typography.Text code className="mono" style={{ fontSize: '12px', color: '#059669' }}>{v}</Typography.Text>
    },
    {
      title: 'Last Run',
      key: 'lastRun',
      width: 140,
      render: (_, record) => {
        const last = record.taskExecutions && record.taskExecutions.length > 0 ? record.taskExecutions[record.taskExecutions.length - 1] : undefined
        if (!last) return <Tag color="default" style={{ fontSize: '11px' }}>Never</Tag>
        return <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{dayjs(last.endTime || last.startTime).format('MM/DD HH:mm')}</Typography.Text>
      }
    },
    {
      title: 'Last Output',
      key: 'lastOutput',
      width: 300,
      render: (_, record) => {
        const last = record.taskExecutions && record.taskExecutions.length > 0 ? record.taskExecutions[record.taskExecutions.length - 1] : undefined
        return <Typography.Text type="secondary" className="mono" style={{ fontSize: '12px', display: 'block', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{last?.output || '-'}</Typography.Text>
      }
    },
    {
      title: 'Executions',
      dataIndex: 'taskExecutions',
      width: 100,
      render: (list?: TaskExecution[]) => <Badge count={list?.length ?? 0} showZero color="blue" style={{ fontSize: '11px' }} />
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <div className="action-buttons">
          <Tooltip title="Run Command">
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={async () => {
              try {
                const updated = await run(record.id)
                setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
                message.success('Command executed successfully')
              } catch {
                message.error('Execution failed')
              }
            }} />
          </Tooltip>
          <Tooltip title="View Executions">
            <Button icon={<EyeOutlined />} onClick={() => setViewTask(record)} />
          </Tooltip>
          <Tooltip title="Delete Task">
            <Button danger icon={<DeleteOutlined />} onClick={async () => {
              try {
                await remove(record.id)
                message.success('Task deleted')
                fetchAll()
              } catch {
                message.error('Delete failed')
              }
            }} />
          </Tooltip>
        </div>
      )
    }
  ], [run, remove, fetchAll])

  return (
    <div className="main-content">
      {/* Stats Section */}
      <TaskStats tasks={tasks} />

      {/* Search and Actions */}
      <div className="search-section">
        <Input
          style={{ width: 320, maxWidth: '100%' }}
          placeholder="Search tasks by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          allowClear
          prefix={<SearchOutlined />}
          onPressEnter={onSearch}
        />
        <Button onClick={onSearch} icon={<SearchOutlined />}>Search</Button>
        <Button onClick={() => { setQuery(''); fetchAll() }} icon={<ReloadOutlined />}>Reset</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreateClick}>New Task</Button>
      </div>

      {/* Main Content Grid */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <AntCard className="task-card" title="Task Management" extra={<Typography.Text type="secondary">{tasks.length} total tasks</Typography.Text>}>
            <Table
              rowKey="id"
              loading={loading}
              dataSource={tasks}
              columns={columns}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tasks`,
                pageSizeOptions: ['10', '15', '20', '50']
              }}
              locale={{ emptyText: <Empty description="No tasks found" /> }}
              className="task-table"
              scroll={{ x: 1200 }}
              size="middle"
            />
          </AntCard>
        </Col>
        <Col xs={24} lg={8}>
          <RecentActivity tasks={tasks} />
        </Col>
      </Row>

      <ExecutionsDrawer task={viewTask} open={!!viewTask} onClose={() => setViewTask(undefined)} />
    </div>
  )
}

function App() {
  const [createModalOpen, setCreateModalOpen] = useState(false)

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <AntdApp>
        <Layout style={{ minHeight: '100vh' }}>
          <Layout.Sider breakpoint="lg" collapsedWidth={0} width={280} theme="dark">
            <div className="sider-logo">
              <ThunderboltOutlined style={{ color: '#fff', fontSize: 24 }} />
              <span>Task Orchestrator</span>
            </div>
            <Menu
              theme="dark"
              mode="inline"
              defaultSelectedKeys={["tasks"]}
              items={[
                { key: 'tasks', icon: <AppstoreOutlined />, label: 'Task Management' }
              ]}
              style={{ marginTop: 16 }}
            />
          </Layout.Sider>
          <Layout>
            <Layout.Header style={{ background: 'white', padding: '0 32px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderBottom: '1px solid #e2e8f0' }}>
              <div className="dashboard-header" style={{ background: 'transparent', padding: 0, margin: 0, boxShadow: 'none' }}>
                <div className="header-content">
                  <div className="header-left">
                    <h1 style={{ fontSize: '20px', fontWeight: '600' }}>Task Orchestrator</h1>
                    <p>Manage and execute shell commands across your infrastructure</p>
                  </div>
                  <div className="header-stats">
                    <div className="stat-item">
                      <span className="stat-number">12</span>
                      <span className="stat-label">Active Tasks</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">156</span>
                      <span className="stat-label">Executions</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">98%</span>
                      <span className="stat-label">Success Rate</span>
                    </div>
                  </div>
                </div>
              </div>
            </Layout.Header>
            <Layout.Content className="content-wrap">
              <TaskList onCreateClick={() => setCreateModalOpen(true)} />
            </Layout.Content>
          </Layout>
        </Layout>
        <CreateTaskForm open={createModalOpen} onClose={() => setCreateModalOpen(false)} onCreated={() => setCreateModalOpen(false)} />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
