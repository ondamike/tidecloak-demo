"use client"

import { createContext, useContext, useState, useEffect } from "react";
// Instead of tidecloak.json as writing to that configuration file rerenders the whole application.
import settings from "/test-realm.json";

// Create once, share, and  avoid creating on each rerender. 
const Context = createContext();
const realm = settings.realm;
const baseURL = "http://localhost:8080";

/**
 * Updating baseURL and realm name for all pages and components is done here.
 * @param {JSX.Element} children - all other child components, so that they can access these values 
 * @returns {JSX.Element} - HTML, wrapped around everything in layout.js
 */
export const Provider = ({ children }) => {

    const [page, setPage] = useState("Landing"); //TODO: Temporary, redo when UI is done
    const [loggedUser, setLoggedUser] = useState(null);

    useEffect(() => {
        // Get the stored user even on refresh of a page 
        const stored = localStorage.getItem("user");
        console.log(stored);
        if (stored){
            setLoggedUser(JSON.parse(stored));
        }
    }, [])
    
    const logUser = (user) => {
        setLoggedUser(user);
        // Store for incase the page gets refreshed
        localStorage.setItem("user", JSON.stringify(user));
    }
 
    return (
        <Context.Provider value={{realm, baseURL, logUser, loggedUser, page, setPage}}>
            {children}
        </Context.Provider>
    )
}

// Custom hook to call shared values in components
export const useAppContext = () => useContext(Context);