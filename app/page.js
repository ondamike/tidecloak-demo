"use client"

import React, { useState, useLayoutEffect, useEffect } from "react";

import {
  FaDiscord,
  FaLinkedin,
  FaGithub,
  FaCheckCircle,
} from "react-icons/fa";

import AccordionBox from "./components/accordionBox";
import Button from "./components/button";

import { SiX } from "react-icons/si"; // Modern X (formerly Twitter) icon

import IAMService from "../lib/IAMService";
import { useAppContext } from "./context/context";
import appService from "../lib/appService";
// Required for the Approval and Commit Tide Encalve to work in the admin console.
import { Heimdall } from "../tide-modules/heimdall";
import { useRouter } from "next/navigation";





// Main App Component

export default function App() {

  const router = useRouter();

  const [jwt, setJwt] = useState(null);
  const [expandedBlobs, setExpandedBlobs] = useState({});
  const [userFeedback, setUserFeedback] = useState("");
  const [showUserInfoAccordion, setShowUserInfoAccordion] = useState(false);
  
  const [showLoginAccordion, setShowLoginAccordion] = useState(false);
  
  const [showExposureAccordion, setShowExposureAccordion] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);

  const {realm, baseURL, logUser, page, setPage} = useAppContext();

  const [loading, setLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState();
  const [users, setUsers] = useState([]);
  const [encryptedDob, setEncryptedDob] = useState("");
  const [encryptedCc, setEncryptedCc] = useState("");
  const [isTideAdmin, setIsTideAdmin] = useState(false);
  

  


  // Initiate Keycloak to handle token and Tide enclave
  useEffect(() => {
    IAMService.initIAM(() => {
      if (IAMService.isLoggedIn()){
        
        setPage("User");                                                                    // TODO: Temporary
        // Set the access token if logged in on initial render
        const token = async () => {setJwt(await IAMService.getToken())};                    // TODO: Temporary
        token();
        getAllUsers();
      }
      setLoading(false);
    });
  }, [])


  // Provide the context the logged in user object to be shared across components
  const setLoggedInUser = async () => { 
    const token = await IAMService.getToken();
    const loggedVuid =  await IAMService.getValueFromToken("vuid");
    const users = await appService.getUsers(baseURL, realm, token);
    const user = users.find(user => {
      if (user.attributes.vuid[0] === loggedVuid){
        return user;
      }
    });
    logUser(user);
  }

  // Checking for token (if exists then user is logged in) then share the user object
  useEffect(() => {
    if(jwt){
      setLoggedInUser();
    };
  }, [jwt])



  const [formData, setFormData] = useState({
    dob: "",
    cc: ""
  });

  const [savedData, setSavedData] = useState({ dob: "", cc: "" });

  const handleUserFieldChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  // Get all users, and find the logged in user's data based on the vuid from the token
  const getAllUsers = async () => { 
    try {
      const token = await IAMService.getToken();
      const users = await appService.getUsers(baseURL, realm, token);
      setUsers(users);
      const loggedVuid = IAMService.getValueFromToken("vuid");
      const user = users.find(user => {
        if (user.attributes.vuid[0] === loggedVuid){
          return user;
        }
      });
      console.log(user);
      setLoggedUser(user);
  
      // Fill the fields if logged user has the attributes
      if (user.attributes.dob){
        // Display this in accordion
        setEncryptedDob(user.attributes.dob);
        // DOB format in Keycloak needs to be "YYYY-MM-DD" to display
        const decryptedDob = await IAMService.doDecrypt([
          {
            "encrypted": user.attributes.dob[0],
            "tags": ["dob"]
          }
        ])
        //user.attributes.dob = decryptedDob[0]; 
        setFormData(prev => ({...prev, dob: decryptedDob}));
        setSavedData(prev => ({...prev, dob: decryptedDob}));
      }
  
      if (user.attributes.cc){
        // Display this in accordion
        setEncryptedCc(user.attributes.cc);
        const decryptedCc = await IAMService.doDecrypt([
          {
            "encrypted": user.attributes.cc[0],
            "tags": ["cc"]
          }
        ])
        //user.attributes.cc = decryptedCc[0];
        setFormData(prev => ({...prev, cc: decryptedCc}));
        setSavedData(prev => ({...prev, cc: decryptedCc}));
      }
    } catch (error){
      console.log(error);
    }
  };

  const handleLogin =  () => {
    IAMService.doLogin();
  };

  const handleLogout = () => {
    IAMService.doLogout();
  };

  const shortenString = (string) => {
    const start = string.slice(0, 20);
    const end = string.slice(20);
    return `${start}...${end}`;
  } 


  // Animation
  function DecryptingText({ text, speed = 30 }) {
    const [displayed, setDisplayed] = useState('');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  
    useEffect(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed((prev) =>
          text
            .split('')
            .map((char, idx) => {
              if (idx < i) return text[idx];
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );
        i++;
        if (i > text.length) clearInterval(interval);
      }, speed);
  
      return () => clearInterval(interval);
    }, [text, speed]);
  
    return <span className="font-mono text-green-600">{displayed}</span>;
  }
  
  
  function DecryptedRow({ isUser, user, username, dob, cc, canRead }) {
    const [decrypted, setDecrypted] = useState(false);
    const [decryptionStatus, setDecryptionStatus] = useState("");
    const [animating, setAnimating] = useState(false);
    const [decryptedDob, setDecryptedDob] = useState("");
    const [decryptedCc, setDecryptedCc] = useState("");
    // Calls on Decrypt button being selected to update the fields
    const handleDecrypt = () => {

      if (!isUser) {
        setDecryptionStatus("Access denied: You don't have decryption rights.");
        setTimeout(() => setDecryptionStatus(""), 3000);
        return;
      }
  
      if (!canRead) {
        setDecryptionStatus("Access denied: You lack read permission.");
        setTimeout(() => setDecryptionStatus(""), 3000);
        return;
      }
  
      setAnimating(true);
      setTimeout(async () => {
        const decryptedDobData = await IAMService.doDecrypt([
          {
            "encrypted": user.attributes.dob[0],
            "tags": ["dob"]
          }
        ])
        setDecryptedDob(decryptedDobData[0]); 

        const decryptedCcData = await IAMService.doDecrypt([
          {
            "encrypted": user.attributes.cc[0],
            "tags": ["cc"]
          }
        ])
        setDecryptedCc(decryptedCcData[0]); 

        setDecrypted(true);
        setAnimating(false);
        setDecryptionStatus("Decrypted successfully!");
        setTimeout(() => setDecryptionStatus(""), 3000);
      }, 800);
    };
  
  
    return (
      <div className="border border-gray-300 rounded p-4 bg-white shadow-sm space-y-2">
        <div className="text-sm font-mono break-all">
          <strong className="block text-gray-600 text-xs uppercase mb-1">Username</strong>
          {username}
        </div>
  
        <div className="text-sm font-mono break-all">
          <strong className="block text-gray-600 text-xs uppercase mb-1">Date of Birth</strong>
          <span className={`inline-block transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
            {isUser && decrypted && dob ? <DecryptingText text={decryptedDob} /> : user.attributes.dob}
          </span>
        </div>
  
        <div className="text-sm font-mono break-all">
          <strong className="block text-gray-600 text-xs uppercase mb-1">Credit Card</strong>
          <span className={`inline-block transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
            {isUser && decrypted && cc ? <DecryptingText text={decryptedCc} /> : user.attributes.dob}
          </span>
        </div>
  
        <div className="flex items-center gap-3">
          <Button onClick={handleDecrypt} disabled={decrypted}>
            {decrypted ? "✓ Decrypted" : "Decrypt"}
          </Button>
  
          {decryptionStatus && (
            <span
              className={`text-sm ${decryptionStatus.startsWith("Access") ? "text-red-600" : "text-green-600"}`}
            >
              {decryptionStatus}
            </span>
          )}
        </div>
  
      </div>
    );
  }

  function DatabaseExposureTable() {

    return (
      <div className="mt-6 space-y-6 pb-24 md:pb-36">
        {users.map((user, i) => (
          <DecryptedRow key={i}
            isUser={user.attributes.vuid[0] === IAMService.getValueFromToken("vuid")}
            user={user}
            username={user.username}
            dob={IAMService.hasOneRole("_tide_dob.read") ? user.attributes.dob : null}
            cc={IAMService.hasOneRole("_tide_cc.read") ? user.attributes.cc : null}
            canRead={IAMService.hasOneRole("_tide_dob.read") || IAMService.hasOneRole("_tide_cc.read")}
          />
  
        ))}
      </div>
    );
  }

  

  const handleAdminButton = async () => {
    const token = await IAMService.getToken();
    
    // Get Realm Management default client's ID
    const clientID = await appService.getRealmManagementId(baseURL, realm, token);
    
    // Check if user already has the role
    setIsTideAdmin(await appService.checkUserAdminRole(baseURL, realm, loggedUser.id, clientID, token));
    router.push(`/admin?clientID=${clientID}`);
  };

  

  const handleFormSubmit = async (e) => {
    try {
      e.preventDefault();
      if (formData.dob !== ""){
        const encryptedDob = await IAMService.doEncrypt([
          {
            "data": formData.dob,
            "tags": ["dob"]
          }
        ]);
        loggedUser.attributes.dob = encryptedDob[0];
        setEncryptedDob(encryptedDob[0]);
      }
  
      if (formData.cc !== ""){
        const encryptedCc = await IAMService.doEncrypt([
          {
            "data": formData.cc,
            "tags": ["cc"]
          }
        ]);
        loggedUser.attributes.cc = encryptedCc[0];
        setEncryptedCc(encryptedCc[0]);
      }
  
      const token = await IAMService.getToken();
      const response = await appService.updateUser(baseURL, realm, loggedUser, token);

      if (response.ok){
        setSavedData({ ...formData });
        setUserFeedback("Changes saved!");
        setTimeout(() => setUserFeedback(""), 3000); // clear after 3 seconds
        console.log("Updated User!");
      }

    }
    catch (error) {
      console.log(error);
    }
    
  };


  


  // const handleReview = (id) => {
  //   setRequests(prev =>
  //     prev.map(req =>
  //       req.id === id && req.status === "Draft"
  //         ? { ...req, status: "Pending" }
  //         : req
  //     )
  //   );
  // };

 
  
  
  


  return (
    !loading
    ?
    <div className="min-h-screen flex flex-col bg-white">
      {IAMService.isLoggedIn() && (
        <nav className="flex justify-start gap-4 px-8 py-4 border-b border-gray-200">
          <button
            onClick={() => setPage("User")}
            className={`px-4 py-2 rounded transition ${page === "User" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
          >
            User
          </button>
          <button
            onClick={() => handleAdminButton()}
            className={`px-4 py-2 rounded transition ${page === "Admin" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
          >
            Administration
          </button>
          <Button onClick={handleLogout}>Logout</Button>
        </nav>
      )}

      <main className="flex-grow w-full pt-6 pb-16">

        <div className="w-full px-8 max-w-screen-md mx-auto flex flex-col items-start gap-8">
          <div className="w-full max-w-3xl">
            {page === "Landing" && (
              <div key="user" className="space-y-4 relative pb-32 md:pb-40">

                {/* Accordion Toggle for Landing Page */}
                <button
                  onClick={() => setShowLoginAccordion(prev => !prev)}
                  className="absolute -top-2 right-0 text-2xl hover:scale-110 transition-transform"
                  aria-label="Toggle explainer"
                >
                  {showLoginAccordion ? "🤯" : "🤔"}
                </button>

                {/* Accordion Content */}
                <AccordionBox title="Why is this login special?" isOpen={showLoginAccordion}>
                  <p>
                    This login page showcases <strong>TideCloak's decentralized IAM model</strong>.
                  </p>
                  <p>
                    Admin powers, even login elevation, are <strong>quorum-controlled</strong> — not granted unilaterally.
                  </p>
                  <p>
                    The system itself has no backdoor. That’s the point.
                  </p>
                </AccordionBox>



                <div className="bg-blue-50 rounded shadow p-6 space-y-4">
                  <h2 className="text-3xl font-bold">Welcome to your demo app</h2>
                  <p>Traditional IAM is only as secure as the admins and systems managing it. TideCloak fundamentally removes this risk, by ensuring no-one holds the keys to the kingdom. Explore to learn how.</p>
                  <h3 className="text-xl font-semibold">BYOiD</h3>
                  <p className="text-base">Login or create an account to see the user experience demo.</p>
                  <Button onClick={handleLogin}>Login</Button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-semibold mb-2">TideCloak Administration</h3>
                  <p className="mb-4">Check out the backend of TideCloak, your fully fledged IAM system.</p>
                  <div className="border border-dashed border-gray-500 p-4">
                    <ul className="list-disc list-inside">
                      <li>
                        Visit: <a href="http://xxxxxxxxxxxxxxxxxxxxx" className="text-blue-600">http://xxxxxxxxxxxxxxxxxxxxx</a>
                      </li>
                      <li>Use Credentials: admin / password</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {page === "User" && (
              <div key="user" className="space-y-4 relative">
                {/* Accordion toggle */}
                <button
                  onClick={() => setShowUserInfoAccordion(prev => !prev)}
                  className="absolute -top-2 right-0 text-2xl hover:scale-110 transition-transform"
                  aria-label="Toggle explanation"
                >
                  {showUserInfoAccordion ? "🤯" : "🤔"}
                </button>

                {/* Accordion content */}
                <AccordionBox title="Why is this special?" isOpen={showUserInfoAccordion}>
                  <p>
                    You’re seeing <strong>dynamic user field access</strong> in action. The form respects granular permissions
                    (read, write, none) in real time.
                  </p>
                  <p>
                    Access is governed by <strong>immutable policy requests</strong>, and changes are enforced only through
                    quorum approvals — including admin access itself.
                  </p>
                </AccordionBox>


                <h2 className="text-3xl font-bold mb-4">User Information</h2>

                <p className="text-sm text-gray-600 mb-6">This form is powered by real-time permission logic. Your ability to view or edit each field depends on your current access.</p>

                <form className="space-y-6" onSubmit={handleFormSubmit}>
                  {
                    ["dob", "cc"].map((field) => {
                      const readPerms = IAMService.hasOneRole(field === "dob"? "_tide_dob.read" : "_tide_cc.read");
                      const writePerms = IAMService.hasOneRole(field === "dob"? "_tide_dob.write" : "_tide_cc.write");
                      const canRead = readPerms? true: false;
                      const canWrite = writePerms? true: false;
                      const label = field === "dob" ? "Date of Birth" : "Credit Card Number";
                      if (!canRead && !canWrite) return null; // hide if no access

                      return (
                        <div key={field}>
                          <label className="block font-medium text-sm mb-1">{label}</label>
                          {canRead && canWrite && (
                            <input
                              type={field === "dob" ? "date" : "text"}
                              value={formData[field]}
                              onChange={handleUserFieldChange(field)}
                              className="border rounded px-3 py-2 w-full max-w-md"
                            />
                          )}

                          {canRead && !canWrite && (
                            <input
                              type="text"
                              value={savedData[field] || ""}
                              readOnly
                              className="border rounded px-3 py-2 w-full bg-gray-100 text-gray-700 max-w-md"
                            />
                          )}

                          {!canRead && canWrite && (
                            <input
                              type={field === "dob" ? "date" : "text"}
                              placeholder={`Enter ${label.toLowerCase()}`}
                              value={formData[field]}
                              onChange={handleUserFieldChange(field)}
                              className="border rounded px-3 py-2 w-full max-w-md"
                            />
                          )}

                          {showUserInfoAccordion && (
                            <div className="text-xs text-gray-600 mt-2 space-y-2 bg-gray-50 border border-gray-200 rounded p-3">
                              <h5 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">
                                JWT Permissions & Encrypted Value
                              </h5>
                              <div className="flex gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${canRead ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                >
                                  {canRead ? "✓" : "✕"} Read
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${canWrite ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                >
                                  {canWrite ? "✓" : "✕"} Write
                                </span>
                              </div>

                              <p>
                                <span className="font-medium">Value in Database:</span>{" "}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedBlobs((prev) => ({ ...prev, [field]: !prev[field] }))
                                  }
                                  className="text-blue-600 underline"
                                >
                                  {
                                    field === "dob" 
                                    ? expandedBlobs[field]
                                      ? encryptedDob
                                      : shortenString(encryptedDob)
                                    : expandedBlobs[field]
                                      ? encryptedCc
                                      : shortenString(encryptedCc)
                                    
                                    
                                  }
                                </button>
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })
                  }
                  {
                  (IAMService.hasOneRole("_tide_dob.write") || IAMService.hasOneRole("_tide_cc.write")) && (
                    <div className="flex items-center gap-3">
                      <Button type="submit">Save Changes</Button>
                      {userFeedback && (
                        <span className="text-sm text-green-600 font-medium">{userFeedback}</span>
                      )}
                    </div>

                  )}
                </form>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-semibold">Database Exposure Simulation</h3>

                    <button
                      onClick={() => setShowExposureAccordion(prev => !prev)}
                      className="text-2xl hover:scale-110 transition-transform"
                      aria-label="Toggle explanation"
                    >
                      {showExposureAccordion ? "🤯" : "🤔"}
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">This simulates a user table leak through unprotected API or misconfigured server.</p>

                  <AccordionBox title="What does this simulate?" isOpen={showExposureAccordion}>
                    <p>
                      This simulation shows what happens when an encrypted user table is leaked.
                      Try decrypting your own row — other rows will remain locked unless you have access.
                    </p>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowDeepDive(prev => !prev)}
                        className="flex items-center gap-2 ml-auto text-xs font-medium text-blue-700 hover:text-blue-900 transition"
                        aria-label="Show technical explanation"
                      >
                        <span className="underline">Technical Deep Dive</span>
                        <span className="text-xl">🤓</span>
                      </button>
                    </div>

                    {showDeepDive && (
                      <div className="mt-3 border-t pt-4 space-y-3 text-xs text-gray-700">
                        <p>
                          🔐 Each record is encrypted at rest. Even if the table is exfiltrated, fields like DOB and CC remain opaque unless a valid JWT with <code className="bg-gray-100 px-1 py-0.5 rounded">read</code> rights is presented.
                          The decryption flow references permissions attached to the JWT — not role-based access.
                        </p>
                        <div className="w-full overflow-auto">
                          <img
                            src="/diagrams/db-decrypt-flow.svg"
                            alt="Decryption permission flow diagram"
                            className="w-full max-w-md border rounded shadow"
                          />
                        </div>
                        <p className="italic text-gray-500">
                          Excerpted from the <a href="https://github.com/tide-foundation/tidecloakspaces" className="underline text-blue-600" target="_blank" rel="noopener noreferrer">TideCloakSpaces</a> repo.
                        </p>
                      </div>
                    )}
                  </AccordionBox>


                  <DatabaseExposureTable />

                </div>

              </div>

            )}

            
          </div>

        </div>
      </main>

      <footer className="mt-auto p-4 bg-gray-100 flex flex-col md:flex-row justify-between items-center text-sm gap-2 md:gap-0">

        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
          <p>
            Secured by{" "}
            <a href="https://tide.org/tidecloak_product" className="text-blue-600 underline" target="_blank">TideCloak</a>
          </p>
          <a
            href="https://tide.org/beta"
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-blue-500 transition"
            target="_blank"
          >
            Join the Beta program
          </a>
        </div>
        <div className="flex gap-4 text-xl">
          <a
            href="https://discord.gg/XBMd9ny2q5"
            aria-label="Discord"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <FaDiscord />
          </a>
          <a
            href="https://twitter.com/tidefoundation"
            aria-label="X (formerly Twitter)"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <SiX />
          </a>
          <a
            href="https://www.linkedin.com/company/tide-foundation/"
            aria-label="LinkedIn"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://github.com/tide-foundation/tidecloakspaces"
            aria-label="GitHub"
            className="hover:text-blue-500 transition"
            target="_blank"
          >
            <FaGithub />
          </a>
        </div>
      </footer>

    </div>
  : null
  );
}
