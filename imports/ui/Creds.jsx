/**
 * Creds.jsx
 *
 * Login form shown when no user is authenticated.
 *
 * Responsibilities:
 *  - Render a simple username/password form.
 *  - Call Meteor.loginWithPassword on submit and log any error reason.
 *
 * What the code does (step-by-step):
 *  - Defines onError to log server/client login errors (prints e.reason if present).
 *  - onSubmit prevents default form submission, reads the user and pass inputs,
 *    calls Meteor.loginWithPassword(..., onError) and logs a message if Accounts.loggingIn() is true.
 *  - Renders a form with inputs for user and password and a submit button.
 *
 * Usage:
 *  <Creds />
 */
import React from 'react';
import {Meteor} from "meteor/meteor" 
import { Accounts } from 'meteor/accounts-base'
import styles from './styles/creds'


export const Creds = () => {

    const onError=(e)=>{
        if(e){
            console.log(e.reason)
        }
    }

    const onSubmit=(e)=>{
        e.preventDefault()
        Meteor.loginWithPassword(e.target.user.value,e.target.pass.value,onError)
        if(Accounts.loggingIn()){console.log("Logging in....")}
    }

    return(
    <div id='Creds' style={styles}>
        <form onSubmit={onSubmit} style={styles}>
            <input id='user' type="text"placeholder='User' required/>
            <input id='pass' type="password"placeholder='Password' required/>
            <button id='submitButton' type='submit'>Login</button>
        </form>
    </div>
)};


export default Creds;