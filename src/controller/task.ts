import { Request, Response, NextFunction } from 'express'
import TaskModel, { Task, TaskImportance, TaskStatus } from '../model/task'
import { TaskNotFoundError } from '../errors/HttpErrors'
import logger from '../lib/logger'

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
      logger.info('Task created', { id: newTask._id })
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
      const { importance, status } = req.query
      const filter = {
        ...importance && { importance: importance as TaskImportance },
        ...status && { status: status as TaskStatus }
      }
      const [taskTotal, tasks] = await Promise.all([
        TaskModel.countDocuments(filter),
        TaskModel.find(filter)
          .skip(skip)
          .limit(limit)
          .lean()
      ])
      res.send({
        tasks,
        total: taskTotal,
        limit,
        skip
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
      const updatedTask: Task = await TaskModel.findOneAndReplace(
        { _id: req.params.id },
        {
          description,
          importance,
          status,
          title
        },
        { new: true }).lean()
      logger.info('Task replaced', { task: updatedTask._id })
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
      logger.info('Task updated', { task: updatedTask._id })
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
      logger.info('Task with id deleted', { task: task._id })
      res.sendStatus(204)
    } catch (err) {
      next(err)
    }
  }
}
