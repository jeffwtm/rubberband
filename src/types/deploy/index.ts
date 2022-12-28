import { DeployHandler } from '../../deploy'
import { DeploymentTargetType } from '../config'

export type DeployHandlers = Record<DeploymentTargetType, DeployHandler>
