import { Request, Response, NextFunction } from 'express'
import TaskModel, { Task } from '../model/task'
import { TaskNotFoundError } from '../errors/HttpErrors'
import Logger from '../lib/logger'

export default {
  async createTask (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, importance, status } = req.body
      const newTask: Task = await TaskModel.create({
        title,
        description,
        importance,
        status
      })
      Logger.info('Task created', {
        id: newTask._id,
        statusCode: res.statusCode
      })
      res.status(201).send(newTask)
    } catch (err) {
      next(err)
    }
  },

  async getAllTasks (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let limit = parseInt(req.query.limit as string) || 20
      const skip = parseInt(req.query.skip as string) || 0
      if (limit > 100) {
        limit = 100
      }
      const [taskTotal, tasks] = await Promise.all([
        TaskModel.countDocuments({}),
        TaskModel.find({})
          .skip(skip)
          .limit(limit)
          .lean()
      ])
      Logger.info('Total number of tasks are', {
        total: taskTotal,
        statusCode: res.statusCode
      })
      Logger.info('Founded tasks', { tasks: Object.values(tasks) })
      res.send({
        tasks,
        total: taskTotal,
        limit: limit,
        skip: skip
      })
    } catch (err) {
      next(err)
    }
  },

  async getTaskById (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task: Task | null = await TaskModel.findById(req.params.id).lean()
      if (!task) {
        throw new TaskNotFoundError()
      }
      Logger.info('Task found', {
        taskId: task,
        statusCode: res.statusCode
      })
      res.send(task)
    } catch (err) {
      next(err)
    }
  },

  async replaceTask (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, status, importance } = req.body
      const task: Task | null = await TaskModel.findById(req.params.id).lean()
      if (!task) {
        throw new TaskNotFoundError()
      }
      const updatedTask = await TaskModel.findOneAndReplace(
        { _id: req.params.id },
        {
          description,
          importance,
          status,
          title
        },
        { upsert: true }).lean()
      Logger.info('Task replaced', {
        task: updatedTask,
        statusCode: res.statusCode
      })
      res.send(updatedTask)
    } catch (err) {
      next(err)
    }
  },

  async updateTask (req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      const { title, description, status, importance } = req.body
      const task: Task | null = await TaskModel.findById(req.params.id).lean()
      if (!task) {
        throw new TaskNotFoundError()
      }
      const updatedTask: Task = await TaskModel.findOneAndUpdate(
        { _id: req.params.id },
        {
          title,
          description,
          status,
          importance
        },
        { new: true }).lean()
      Logger.info('Task updated', {
        task: updatedTask,
        statusCode: res.statusCode
      })
      res.send(updatedTask)
    } catch (err) {
      next(err)
    }
  },

  async deleteTask (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task: Task | null = await TaskModel.findById(req.params.id).lean()
      if (!task) {
        throw new TaskNotFoundError()
      }
      await TaskModel.deleteOne({ _id: req.params.id })
      Logger.info('Task with id deleted', {
        id: req.params.id,
        statusCode: res.statusCode
      })
      res.sendStatus(204)
    } catch (err) {
      next(err)
    }
  }
}
