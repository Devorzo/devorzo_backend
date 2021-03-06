/* eslint-disable no-unused-vars */
import User from "../../database/models/user"
import Communities from "../../database/models/communities"
// eslint-disable-next-line no-unused-vars
import { Request, Response, NextFunction } from "express"
import logger, { Level } from "../../lib/logger"
// import { Request } from "../../interfaces/express"


export enum Auth {
    "IS_LOGGED_IN",
    "IS_LOGGED_OUT",
    "CHECK_AUTH"
}

export const auth_middleware = (req: Request, res: Response, next: NextFunction, auth_mode = Auth.IS_LOGGED_IN) => {
    let token: any
    if (req.header)
        token = req.header("x-auth")
    if (!token) {
        token = req.query.xAuthToken
    }
    if (!token) {
        token = req.body.xAuthToken
    }
    // if (!token) {
    //     if (req.session)
    //         token = req.session.xAuth
    // }

    if (token) {
        User.findByToken(token, "auth").then((user: any) => {
            if (!user) {
                return Promise.reject()
            }
            if (auth_mode == Auth.IS_LOGGED_IN) {
                req.user = user.toJSON()
                req.token = token
                next()
            }
            else if (auth_mode == Auth.IS_LOGGED_OUT) {
                res.status(401).send({ success: false, error: { message: "AUTH EXISTS" } })
            } else if (auth_mode == Auth.CHECK_AUTH) {
                req.user = user.toJSON()
                req.token = token
                next()
            }

        }).catch((e: any) => {
            logger({ e }, Level.ERROR)

            if (auth_mode == Auth.IS_LOGGED_IN) {
                res.status(401).send({ success: false, error: { message: "INVALID AUTH 1" } })
            }
            else if (auth_mode == Auth.IS_LOGGED_OUT) {
                req.user = null
                req.token = null
                next()
            } else if (auth_mode == Auth.CHECK_AUTH) {
                req.user = null
                req.token = null
                next()
            }
        })
    } else {

        if (auth_mode == Auth.IS_LOGGED_IN) {
            res.status(401).send({ success: false, error: { message: "INVALID AUTH 2" } })
        }
        else if (auth_mode == Auth.IS_LOGGED_OUT) {
            req.user = null
            req.token = null
            next()
        } else if (auth_mode == Auth.CHECK_AUTH) {
            req.user = null
            req.token = null
            next()
        }
    }
}

export const checkIfUserIsAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user != null && req.token != null) {
        if (req.user.details.account_type === 1) {
            // check for account type in the condition above
            next()
        } else {
            res.status(401).send({ success: false, error: { message: "INVALID AUTH" } })
        }
    } else {
        res.status(401).send({ success: false, error: { message: "INVALID AUTH" } })
    }
}

export const checkIfUserIsAdminOrModerator = (req: Request, res: Response, next: NextFunction) => {
    if (req.user != null && req.token != null) {
        if (req.user.details.account_type === 1) {
            // check for account type in the condition above
            next()
        } else if (req.body.community_id != null) {
            //check for moderator in community with the user id
            Communities.exists({
                community_id: req.body.community_id,
                "moderator_list.user_id": req.user.user_id
            }).then((doc) => {
                if (doc) {
                    next()
                } else {
                    res.status(401).send({ success: false, error: { message: "INVALID AUTH" } })
                }
            }).catch((e) => {
                console.log(e)
                res.status(401).send({ success: false, error: { message: "INVALID AUTH" } })
            })
        } else {
            res.status(401).send({ success: false, error: { message: "INVALID AUTH" } })
        }
    } else {
        res.status(401).send({ success: false, error: { message: "INVALID AUTH" } })
    }
}

export const checkIfUserIsModerator = (req: Request, res: Response, next: NextFunction) => {
    if (req.user != null && req.token != null) {
        if (req.body.community_id != null) {
            Communities.find({
                community_id: req.body.community_id,
                "users_list.user_id": req.user.user_id
            }).then((doc) => {
                if (doc) {
                    console.log("from auth middleware")
                    console.log({ doc })
                    next()
                } else {
                    res.status(401).send({ success: false, error: { message: "INVALID AUTH" } })
                }
            }).catch((e) => {
                console.log(e)
                res.status(401).send({ success: false, error: { message: "INVALID AUTH" } })
            })
        } else {
            res.status(401).send({ success: false, error: { message: "INVALID AUTH" } })
        }
    } else {
        res.status(401).send({ success: false, error: { message: "INVALID AUTH" } })
    }
}

export const auth_IS_LOGGED_IN = (req: Request, res: Response, next: NextFunction) => {
    auth_middleware(req! as Request, res! as Response, next, Auth.IS_LOGGED_IN)
}

export const auth_IS_LOGGED_OUT = (req: Request, res: Response, next: NextFunction) => {
    auth_middleware(req! as Request, res! as Response, next, Auth.IS_LOGGED_OUT)
}

export const auth_middleware_wrapper_CHECK_AUTH = (req: Request, res: Response, next: NextFunction) => {
    auth_middleware(req! as Request, res! as Response, next, Auth.CHECK_AUTH)
}


export default auth_middleware