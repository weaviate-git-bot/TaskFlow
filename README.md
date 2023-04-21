# chatbot-client

this is the frontend / client side of my chatbot app
1. written in React JS and Google Material Design (MUI)
2. client-side caching by React-query, reducing the number of requests that need to be sent to the server.

to run it local: `npm start`
<br />
back-end server repo here: https://github.com/markNZed/chatbot-server

Be careful of cloudflare caching
The compression via cloudflare is br which is different from the gzip used by the React server, so file sizes can differ
https://react.dev/learn/start-a-new-react-project#production-grade-react-frameworks 
NS_BINDING_ABORTED Shown in Firefox when forcing a page reload. FireFox forced refresh, it assumes that you want to double-check what is in the cache, so it temporarily ignores Expires. https://github.com/facebook/react/issues/25218 "The request gets blocked because the page hasnt loaded yet and there is already another request (get image) being sent while the page request is yet to return completely."
The Nginx proxy was timing out WS connections after 60seconds. Extended to one hour.
Runnig this behind the CloudFlare Trust Zone with CloudFlare with caching breaks React dev mode.

Running on localhost we can set the port for the React client server in package.json where PORT=3000
We can specify the port of the websocket server with environment variable REACT_APP_WS_LOCALHOST_PORT=5000
