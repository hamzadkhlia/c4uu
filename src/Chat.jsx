import { uniqBy } from "lodash";
import { useContext, useEffect, useRef, useState } from "react";
//import { send } from "vite";
import Avatar from "./Avatar";
import Logo from "./Logo";

export default function Chat() {
    const [ws,setWs] = useState(null);
    const [onlinePeople,setOnlinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText,setNewMessageText] = useState('');
    const [messages,setMessages] = useState({});
    const {username,id} = useContext(useContext);
    useEffect(() => {
    const ws = new WebSocket('ws://localhost:4040');
    setWs(ws);
    ws.addEventListener('message', handleMessage)
    }, []);
    function showOnlinePeople(peopleArray) {
        const people = {};
        peopleArray.forEach(({userId,username}) => {
            people[userId] = username;
        });
        setOnlinePeople(people);
    }
    function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);

    if ('oline in messageData') {
        showOnlinePeople(messageData.oline);
    } else if ('text in messageDta') {
        setMessages(prev => ([...prev, {...messageData}]));
    }
    }
    function sendMessage(ev) {
        ev.preventDefault();
        ws.send(JSON.stringify({
            message: {
                recipient: setSelectedUserId,
                text: newMessageText,
            }
        }));
        setNewMessageText('');
        setMessages(prev => ([...prev,{
            text: newMessageText, 
            sender: id,
            recipient: selectedUserId,
            id: Date.now(), 
        }]));
    }
    const onlinePeopleExclOurUser = {...onlinePeople};
    delete onlinePeopleExclOurUser(id)

    const messagesWithoutDupes = uniqBy(messages, 'id');
    return (
    <div className="flex h-screen">
        <div className="bg-white w-1/3">
            <Logo />
            {Object.keys(onlinePeople).map(userId => (
                <div key={userId} onClick={() => setSelectedUserId(userId)} 
                        className={"border-gray-100 flex items-center gap-2 cursor-pointer"+(userId === setSelectedUserId ? 'bg-blue-50' : '')}>
                    {userId === selectedUserId && (
                        <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
                    )}
                    <div className="flex gap-2 py-2 pl-4 items-center">
                    <Avatar username={onlinePeople[userId]} userId={userId} />
                    <span className="text-gray-800">{onlinePeople[userId]}</span>
                    </div>
                    </div>
        ))}
        </div>
        
        <div className="flex flex-col bg-blue-50 w-2/3 p-2">
            <div className="flex-grow">
            {! selectedUserId && (
                <div className="flex h-full flex-grow items-center justify-center">
                    <div className="text-gray-400">&larr; selecet a person from the sidebar</div>
                    </div>
            )}
            {!!selectedUserId && (
                <div className="overflow-y-scroll">
                    {messagesWithoutDupes.map(message => (
                        <div className={(message.sender === id ? 'text-right': 'text-left')}>
                        <div className={"text-left inline-block p-2 my-2 rounded-md text-sm" +(message.sender === id ? 'bg-blue-500 text-white':'bg-white text-gray-500')}>
                        sender:{message.sender}<br />
                        my id: {id}<br />
                        {message.text}
                        </div>
                        </div>
                    ))}
                </div>
            )}
                </div>
                {!!selectedUserId && (
                    <from className="flex gap-2" onSubmit={sendMessage}>
                    <input type="text"
                    value={newMessageText}
                    onChange={ev => setNewMessageText(ev.target.value)}
                        placeholder="type your message here" 
                        className="bg-white flex-grow border rounded-sm p-2"/>
                        <button type="submit" className="bg-blue-500 p-2 text-white rounded-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        </button>
                </from>
                )}
        </div>
    </div>
    );
    
}