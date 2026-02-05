import{A as f,b as o,E as ks,i as xs,n as Pt,a as Xn,t as Zn,r as y}from"./lit-core-BcBtA5fW.js";import{i as ei,r as As,t as ti,e as ni,c as ii}from"./lit-directives-G3w-aQ0c.js";import{d as si,p as pt}from"./markdown-_r1LKq3S.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function n(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=n(s);fetch(s.href,a)}})();async function R(e,t){if(!(!e.client||!e.connected)&&!e.channelsLoading){e.channelsLoading=!0,e.channelsError=null;try{const n=await e.client.request("channels.status",{probe:t,timeoutMs:8e3});e.channelsSnapshot=n,e.channelsLastSuccess=Date.now()}catch(n){e.channelsError=String(n)}finally{e.channelsLoading=!1}}}async function Cs(e,t){if(!(!e.client||!e.connected||e.whatsappBusy)){e.whatsappBusy=!0;try{const n=await e.client.request("web.login.start",{force:t,timeoutMs:3e4});e.whatsappLoginMessage=n.message??null,e.whatsappLoginQrDataUrl=n.qrDataUrl??null,e.whatsappLoginConnected=null}catch(n){e.whatsappLoginMessage=String(n),e.whatsappLoginQrDataUrl=null,e.whatsappLoginConnected=null}finally{e.whatsappBusy=!1}}}async function Is(e){if(!(!e.client||!e.connected||e.whatsappBusy)){e.whatsappBusy=!0;try{const t=await e.client.request("web.login.wait",{timeoutMs:12e4});e.whatsappLoginMessage=t.message??null,e.whatsappLoginConnected=t.connected??null,t.connected&&(e.whatsappLoginQrDataUrl=null)}catch(t){e.whatsappLoginMessage=String(t),e.whatsappLoginConnected=null}finally{e.whatsappBusy=!1}}}async function Ls(e){if(!(!e.client||!e.connected||e.whatsappBusy)){e.whatsappBusy=!0;try{await e.client.request("channels.logout",{channel:"whatsapp"}),e.whatsappLoginMessage="Logged out.",e.whatsappLoginQrDataUrl=null,e.whatsappLoginConnected=null}catch(t){e.whatsappLoginMessage=String(t)}finally{e.whatsappBusy=!1}}}function te(e){return typeof structuredClone=="function"?structuredClone(e):JSON.parse(JSON.stringify(e))}function oe(e){return`${JSON.stringify(e,null,2).trimEnd()}
`}function ai(e,t,n){if(t.length===0)return;let i=e;for(let a=0;a<t.length-1;a+=1){const l=t[a],r=t[a+1];if(typeof l=="number"){if(!Array.isArray(i))return;i[l]==null&&(i[l]=typeof r=="number"?[]:{}),i=i[l]}else{if(typeof i!="object"||i==null)return;const d=i;d[l]==null&&(d[l]=typeof r=="number"?[]:{}),i=d[l]}}const s=t[t.length-1];if(typeof s=="number"){Array.isArray(i)&&(i[s]=n);return}typeof i=="object"&&i!=null&&(i[s]=n)}function oi(e,t){if(t.length===0)return;let n=e;for(let s=0;s<t.length-1;s+=1){const a=t[s];if(typeof a=="number"){if(!Array.isArray(n))return;n=n[a]}else{if(typeof n!="object"||n==null)return;n=n[a]}if(n==null)return}const i=t[t.length-1];if(typeof i=="number"){Array.isArray(n)&&n.splice(i,1);return}typeof n=="object"&&n!=null&&delete n[i]}async function N(e){if(!(!e.client||!e.connected)){e.configLoading=!0,e.lastError=null;try{const t=await e.client.request("config.get",{});Ts(e,t)}catch(t){e.lastError=String(t)}finally{e.configLoading=!1}}}async function li(e){if(!(!e.client||!e.connected)&&!e.configSchemaLoading){e.configSchemaLoading=!0;try{const t=await e.client.request("config.schema",{});_s(e,t)}catch(t){e.lastError=String(t)}finally{e.configSchemaLoading=!1}}}function _s(e,t){e.configSchema=t.schema??null,e.configUiHints=t.uiHints??{},e.configSchemaVersion=t.version??null}function Ts(e,t){e.configSnapshot=t;const n=typeof t.raw=="string"?t.raw:t.config&&typeof t.config=="object"?oe(t.config):e.configRaw;!e.configFormDirty||e.configFormMode==="raw"?e.configRaw=n:e.configForm?e.configRaw=oe(e.configForm):e.configRaw=n,e.configValid=typeof t.valid=="boolean"?t.valid:null,e.configIssues=Array.isArray(t.issues)?t.issues:[],e.configFormDirty||(e.configForm=te(t.config??{}),e.configFormOriginal=te(t.config??{}),e.configRawOriginal=n)}async function Te(e){if(!(!e.client||!e.connected)){e.configSaving=!0,e.lastError=null;try{const t=e.configFormMode==="form"&&e.configForm?oe(e.configForm):e.configRaw,n=e.configSnapshot?.hash;if(!n){e.lastError="Config hash missing; reload and retry.";return}await e.client.request("config.set",{raw:t,baseHash:n}),e.configFormDirty=!1,await N(e),e.showToast?.("success","Config saved")}catch(t){e.lastError=String(t)}finally{e.configSaving=!1}}}async function Es(e){if(!(!e.client||!e.connected)){e.configApplying=!0,e.lastError=null;try{const t=e.configFormMode==="form"&&e.configForm?oe(e.configForm):e.configRaw,n=e.configSnapshot?.hash;if(!n){e.lastError="Config hash missing; reload and retry.";return}await e.client.request("config.apply",{raw:t,baseHash:n,sessionKey:e.applySessionKey}),e.configFormDirty=!1,await N(e),e.showToast?.("success","Config applied")}catch(t){e.lastError=String(t)}finally{e.configApplying=!1}}}async function Ms(e){if(!(!e.client||!e.connected)){e.updateRunning=!0,e.lastError=null;try{await e.client.request("update.run",{sessionKey:e.applySessionKey})}catch(t){e.lastError=String(t)}finally{e.updateRunning=!1}}}function P(e,t,n){const i=te(e.configForm??e.configSnapshot?.config??{});ai(i,t,n),e.configForm=i,e.configFormDirty=!0,e.configFormMode==="form"&&(e.configRaw=oe(i))}function j(e,t){const n=te(e.configForm??e.configSnapshot?.config??{});oi(n,t),e.configForm=n,e.configFormDirty=!0,e.configFormMode==="form"&&(e.configRaw=oe(n))}function Fs(e){const{values:t,original:n}=e;return t.name!==n.name||t.displayName!==n.displayName||t.about!==n.about||t.picture!==n.picture||t.banner!==n.banner||t.website!==n.website||t.nip05!==n.nip05||t.lud16!==n.lud16}function Rs(e){const{state:t,callbacks:n,accountId:i}=e,s=Fs(t),a=(r,d,g={})=>{const{type:p="text",placeholder:v,maxLength:c,help:u}=g,b=t.values[r]??"",w=t.fieldErrors[r],$=`nostr-profile-${r}`;return p==="textarea"?o`
        <div class="form-field" style="margin-bottom: 12px;">
          <label for="${$}" style="display: block; margin-bottom: 4px; font-weight: 500;">
            ${d}
          </label>
          <textarea
            id="${$}"
            .value=${b}
            placeholder=${v??""}
            maxlength=${c??2e3}
            rows="3"
            style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; resize: vertical; font-family: inherit;"
            @input=${S=>{const k=S.target;n.onFieldChange(r,k.value)}}
            ?disabled=${t.saving}
          ></textarea>
          ${u?o`<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${u}</div>`:f}
          ${w?o`<div style="font-size: 12px; color: var(--danger-color); margin-top: 2px;">${w}</div>`:f}
        </div>
      `:o`
      <div class="form-field" style="margin-bottom: 12px;">
        <label for="${$}" style="display: block; margin-bottom: 4px; font-weight: 500;">
          ${d}
        </label>
        <input
          id="${$}"
          type=${p}
          .value=${b}
          placeholder=${v??""}
          maxlength=${c??256}
          style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;"
          @input=${S=>{const k=S.target;n.onFieldChange(r,k.value)}}
          ?disabled=${t.saving}
        />
        ${u?o`<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${u}</div>`:f}
        ${w?o`<div style="font-size: 12px; color: var(--danger-color); margin-top: 2px;">${w}</div>`:f}
      </div>
    `},l=()=>{const r=t.values.picture;return r?o`
      <div style="margin-bottom: 12px;">
        <img
          src=${r}
          alt="Profile picture preview"
          style="max-width: 80px; max-height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);"
          @error=${d=>{const g=d.target;g.style.display="none"}}
          @load=${d=>{const g=d.target;g.style.display="block"}}
        />
      </div>
    `:f};return o`
    <div class="nostr-profile-form" style="padding: 16px; background: var(--bg-secondary); border-radius: 8px; margin-top: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div style="font-weight: 600; font-size: 16px;">Edit Profile</div>
        <div style="font-size: 12px; color: var(--text-muted);">Account: ${i}</div>
      </div>

      ${t.error?o`<div class="callout danger" style="margin-bottom: 12px;">${t.error}</div>`:f}

      ${t.success?o`<div class="callout success" style="margin-bottom: 12px;">${t.success}</div>`:f}

      ${l()}

      ${a("name","Username",{placeholder:"satoshi",maxLength:256,help:"Short username (e.g., satoshi)"})}

      ${a("displayName","Display Name",{placeholder:"Satoshi Nakamoto",maxLength:256,help:"Your full display name"})}

      ${a("about","Bio",{type:"textarea",placeholder:"Tell people about yourself...",maxLength:2e3,help:"A brief bio or description"})}

      ${a("picture","Avatar URL",{type:"url",placeholder:"https://example.com/avatar.jpg",help:"HTTPS URL to your profile picture"})}

      ${t.showAdvanced?o`
            <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px;">
              <div style="font-weight: 500; margin-bottom: 12px; color: var(--text-muted);">Advanced</div>

              ${a("banner","Banner URL",{type:"url",placeholder:"https://example.com/banner.jpg",help:"HTTPS URL to a banner image"})}

              ${a("website","Website",{type:"url",placeholder:"https://example.com",help:"Your personal website"})}

              ${a("nip05","NIP-05 Identifier",{placeholder:"you@example.com",help:"Verifiable identifier (e.g., you@domain.com)"})}

              ${a("lud16","Lightning Address",{placeholder:"you@getalby.com",help:"Lightning address for tips (LUD-16)"})}
            </div>
          `:f}

      <div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
        <button
          class="btn primary"
          @click=${n.onSave}
          ?disabled=${t.saving||!s}
        >
          ${t.saving?"Saving...":"Save & Publish"}
        </button>

        <button
          class="btn"
          @click=${n.onImport}
          ?disabled=${t.importing||t.saving}
        >
          ${t.importing?"Importing...":"Import from Relays"}
        </button>

        <button
          class="btn"
          @click=${n.onToggleAdvanced}
        >
          ${t.showAdvanced?"Hide Advanced":"Show Advanced"}
        </button>

        <button
          class="btn"
          @click=${n.onCancel}
          ?disabled=${t.saving}
        >
          Cancel
        </button>
      </div>

      ${s?o`
              <div style="font-size: 12px; color: var(--warning-color); margin-top: 8px">
                You have unsaved changes
              </div>
            `:f}
    </div>
  `}function Ps(e){const t={name:e?.name??"",displayName:e?.displayName??"",about:e?.about??"",picture:e?.picture??"",banner:e?.banner??"",website:e?.website??"",nip05:e?.nip05??"",lud16:e?.lud16??""};return{values:t,original:{...t},saving:!1,importing:!1,error:null,success:null,fieldErrors:{},showAdvanced:!!(e?.banner||e?.website||e?.nip05||e?.lud16)}}async function Ns(e,t){await Cs(e,t),await R(e,!0)}async function Bs(e){await Is(e),await R(e,!0)}async function Ds(e){await Ls(e),await R(e,!0)}async function Os(e){await Te(e),await N(e),await R(e,!0)}async function Ks(e){await N(e),await R(e,!0)}function Us(e){if(!Array.isArray(e))return{};const t={};for(const n of e){if(typeof n!="string")continue;const[i,...s]=n.split(":");if(!i||s.length===0)continue;const a=i.trim(),l=s.join(":").trim();a&&l&&(t[a]=l)}return t}function ri(e){return(e.channelsSnapshot?.channelAccounts?.nostr??[])[0]?.accountId??e.nostrProfileAccountId??"default"}function ci(e,t=""){return`/api/channels/nostr/${encodeURIComponent(e)}/profile${t}`}function js(e,t,n){e.nostrProfileAccountId=t,e.nostrProfileFormState=Ps(n??void 0)}function Hs(e){e.nostrProfileFormState=null,e.nostrProfileAccountId=null}function zs(e,t,n){const i=e.nostrProfileFormState;i&&(e.nostrProfileFormState={...i,values:{...i.values,[t]:n},fieldErrors:{...i.fieldErrors,[t]:""}})}function Vs(e){const t=e.nostrProfileFormState;t&&(e.nostrProfileFormState={...t,showAdvanced:!t.showAdvanced})}async function qs(e){const t=e.nostrProfileFormState;if(!t||t.saving)return;const n=ri(e);e.nostrProfileFormState={...t,saving:!0,error:null,success:null,fieldErrors:{}};try{const i=await fetch(ci(n),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(t.values)}),s=await i.json().catch(()=>null);if(!i.ok||s?.ok===!1||!s){const a=s?.error??`Profile update failed (${i.status})`;e.nostrProfileFormState={...t,saving:!1,error:a,success:null,fieldErrors:Us(s?.details)};return}if(!s.persisted){e.nostrProfileFormState={...t,saving:!1,error:"Profile publish failed on all relays.",success:null};return}e.nostrProfileFormState={...t,saving:!1,error:null,success:"Profile published to relays.",fieldErrors:{},original:{...t.values}},await R(e,!0)}catch(i){e.nostrProfileFormState={...t,saving:!1,error:`Profile update failed: ${String(i)}`,success:null}}}async function Gs(e){const t=e.nostrProfileFormState;if(!t||t.importing)return;const n=ri(e);e.nostrProfileFormState={...t,importing:!0,error:null,success:null};try{const i=await fetch(ci(n,"/import"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({autoMerge:!0})}),s=await i.json().catch(()=>null);if(!i.ok||s?.ok===!1||!s){const d=s?.error??`Profile import failed (${i.status})`;e.nostrProfileFormState={...t,importing:!1,error:d,success:null};return}const a=s.merged??s.imported??null,l=a?{...t.values,...a}:t.values,r=!!(l.banner||l.website||l.nip05||l.lud16);e.nostrProfileFormState={...t,importing:!1,values:l,error:null,success:s.saved?"Profile imported from relays. Review and publish.":"Profile imported. Review and publish.",showAdvanced:r},s.saved&&await R(e,!0)}catch(i){e.nostrProfileFormState={...t,importing:!1,error:`Profile import failed: ${String(i)}`,success:null}}}function di(e){const t=(e??"").trim();if(!t)return null;const n=t.split(":").filter(Boolean);if(n.length<3||n[0]!=="agent")return null;const i=n[1]?.trim(),s=n.slice(2).join(":");return!i||!s?null:{agentId:i,rest:s}}const ht=450;function Se(e,t=!1){e.chatScrollFrame&&cancelAnimationFrame(e.chatScrollFrame),e.chatScrollTimeout!=null&&(clearTimeout(e.chatScrollTimeout),e.chatScrollTimeout=null);const n=()=>{const i=e.querySelector(".chat-thread");if(i){const s=getComputedStyle(i).overflowY;if(s==="auto"||s==="scroll"||i.scrollHeight-i.clientHeight>1)return i}return document.scrollingElement??document.documentElement};e.updateComplete.then(()=>{e.chatScrollFrame=requestAnimationFrame(()=>{e.chatScrollFrame=null;const i=n();if(!i)return;const s=i.scrollHeight-i.scrollTop-i.clientHeight,a=t&&!e.chatHasAutoScrolled;if(!(a||e.chatUserNearBottom||s<ht)){e.chatNewMessagesBelow=!0;return}a&&(e.chatHasAutoScrolled=!0),i.scrollTop=i.scrollHeight,e.chatUserNearBottom=!0,e.chatNewMessagesBelow=!1;const r=a?150:120;e.chatScrollTimeout=window.setTimeout(()=>{e.chatScrollTimeout=null;const d=n();if(!d)return;const g=d.scrollHeight-d.scrollTop-d.clientHeight;(a||e.chatUserNearBottom||g<ht)&&(d.scrollTop=d.scrollHeight,e.chatUserNearBottom=!0)},r)})})}function ui(e,t=!1){e.logsScrollFrame&&cancelAnimationFrame(e.logsScrollFrame),e.updateComplete.then(()=>{e.logsScrollFrame=requestAnimationFrame(()=>{e.logsScrollFrame=null;const n=e.querySelector(".log-stream");if(!n)return;const i=n.scrollHeight-n.scrollTop-n.clientHeight;(t||i<80)&&(n.scrollTop=n.scrollHeight)})})}function Ws(e,t){const n=t.currentTarget;if(!n)return;const i=n.scrollHeight-n.scrollTop-n.clientHeight;e.chatUserNearBottom=i<ht,e.chatUserNearBottom&&(e.chatNewMessagesBelow=!1)}function Ys(e,t){const n=t.currentTarget;if(!n)return;const i=n.scrollHeight-n.scrollTop-n.clientHeight;e.logsAtBottom=i<80}function on(e){e.chatHasAutoScrolled=!1,e.chatUserNearBottom=!0,e.chatNewMessagesBelow=!1}function Qs(e,t){if(e.length===0)return;const n=new Blob([`${e.join(`
`)}
`],{type:"text/plain"}),i=URL.createObjectURL(n),s=document.createElement("a"),a=new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");s.href=i,s.download=`openclaw-logs-${t}-${a}.log`,s.click(),URL.revokeObjectURL(i)}function Js(e){if(typeof ResizeObserver>"u")return;const t=e.querySelector(".topbar");if(!t)return;const n=()=>{const{height:i}=t.getBoundingClientRect();e.style.setProperty("--topbar-height",`${i}px`)};n(),e.topbarObserver=new ResizeObserver(()=>n()),e.topbarObserver.observe(t)}async function Ke(e){if(!(!e.client||!e.connected)&&!e.debugLoading){e.debugLoading=!0;try{const[t,n,i,s]=await Promise.all([e.client.request("status",{}),e.client.request("health",{}),e.client.request("models.list",{}),e.client.request("last-heartbeat",{})]);e.debugStatus=t,e.debugHealth=n;const a=i;e.debugModels=Array.isArray(a?.models)?a?.models:[],e.debugHeartbeat=s}catch(t){e.debugCallError=String(t)}finally{e.debugLoading=!1}}}async function Xs(e){if(!(!e.client||!e.connected)){e.debugCallError=null,e.debugCallResult=null;try{const t=e.debugCallParams.trim()?JSON.parse(e.debugCallParams):{},n=await e.client.request(e.debugCallMethod.trim(),t);e.debugCallResult=JSON.stringify(n,null,2)}catch(t){e.debugCallError=String(t)}}}const Zs=2e3,ea=new Set(["trace","debug","info","warn","error","fatal"]);function ta(e){if(typeof e!="string")return null;const t=e.trim();if(!t.startsWith("{")||!t.endsWith("}"))return null;try{const n=JSON.parse(t);return!n||typeof n!="object"?null:n}catch{return null}}function na(e){if(typeof e!="string")return null;const t=e.toLowerCase();return ea.has(t)?t:null}function ia(e){if(!e.trim())return{raw:e,message:e};try{const t=JSON.parse(e),n=t&&typeof t._meta=="object"&&t._meta!==null?t._meta:null,i=typeof t.time=="string"?t.time:typeof n?.date=="string"?n?.date:null,s=na(n?.logLevelName??n?.level),a=typeof t[0]=="string"?t[0]:typeof n?.name=="string"?n?.name:null,l=ta(a);let r=null;l&&(typeof l.subsystem=="string"?r=l.subsystem:typeof l.module=="string"&&(r=l.module)),!r&&a&&a.length<120&&(r=a);let d=null;return typeof t[1]=="string"?d=t[1]:!l&&typeof t[0]=="string"?d=t[0]:typeof t.message=="string"&&(d=t.message),{raw:e,time:i,level:s,subsystem:r,message:d??e,meta:n??void 0}}catch{return{raw:e,message:e}}}async function ve(e,t){if(!(!e.client||!e.connected)&&!(e.logsLoading&&!t?.quiet)){t?.quiet||(e.logsLoading=!0),e.logsError=null;try{const i=await e.client.request("logs.tail",{cursor:t?.reset?void 0:e.logsCursor??void 0,limit:e.logsLimit,maxBytes:e.logsMaxBytes}),a=(Array.isArray(i.lines)?i.lines.filter(r=>typeof r=="string"):[]).map(ia),l=!!(t?.reset||i.reset||e.logsCursor==null);e.logsEntries=l?a:[...e.logsEntries,...a].slice(-Zs),typeof i.cursor=="number"&&(e.logsCursor=i.cursor),typeof i.file=="string"&&(e.logsFile=i.file),e.logsTruncated=!!i.truncated,e.logsLastFetchAt=Date.now()}catch(n){e.logsError=String(n)}finally{t?.quiet||(e.logsLoading=!1)}}}async function Ue(e,t){if(!(!e.client||!e.connected)&&!e.nodesLoading){e.nodesLoading=!0,t?.quiet||(e.lastError=null);try{const n=await e.client.request("node.list",{});e.nodes=Array.isArray(n.nodes)?n.nodes:[]}catch(n){t?.quiet||(e.lastError=String(n))}finally{e.nodesLoading=!1}}}function sa(e){e.nodesPollInterval==null&&(e.nodesPollInterval=window.setInterval(()=>{Ue(e,{quiet:!0})},5e3))}function aa(e){e.nodesPollInterval!=null&&(clearInterval(e.nodesPollInterval),e.nodesPollInterval=null)}function Nt(e){e.logsPollInterval==null&&(e.logsPollInterval=window.setInterval(()=>{e.tab==="logs"&&ve(e,{quiet:!0})},2e3))}function Bt(e){e.logsPollInterval!=null&&(clearInterval(e.logsPollInterval),e.logsPollInterval=null)}function Dt(e){e.debugPollInterval==null&&(e.debugPollInterval=window.setInterval(()=>{e.tab==="debug"&&Ke(e)},3e3))}function Ot(e){e.debugPollInterval!=null&&(clearInterval(e.debugPollInterval),e.debugPollInterval=null)}async function gi(e,t){if(!(!e.client||!e.connected||e.agentIdentityLoading)&&!e.agentIdentityById[t]){e.agentIdentityLoading=!0,e.agentIdentityError=null;try{const n=await e.client.request("agent.identity.get",{agentId:t});n&&(e.agentIdentityById={...e.agentIdentityById,[t]:n})}catch(n){e.agentIdentityError=String(n)}finally{e.agentIdentityLoading=!1}}}async function fi(e,t){if(!e.client||!e.connected||e.agentIdentityLoading)return;const n=t.filter(i=>!e.agentIdentityById[i]);if(n.length!==0){e.agentIdentityLoading=!0,e.agentIdentityError=null;try{for(const i of n){const s=await e.client.request("agent.identity.get",{agentId:i});s&&(e.agentIdentityById={...e.agentIdentityById,[i]:s})}}catch(i){e.agentIdentityError=String(i)}finally{e.agentIdentityLoading=!1}}}async function Ee(e,t){if(!(!e.client||!e.connected)&&!e.agentSkillsLoading){e.agentSkillsLoading=!0,e.agentSkillsError=null;try{const n=await e.client.request("skills.status",{agentId:t});n&&(e.agentSkillsReport=n,e.agentSkillsAgentId=t)}catch(n){e.agentSkillsError=String(n)}finally{e.agentSkillsLoading=!1}}}async function pe(e){if(!(!e.client||!e.connected)&&!e.agentsLoading){e.agentsLoading=!0,e.agentsError=null;try{const t=await e.client.request("agents.list",{});if(t){e.agentsList=t;const n=e.agentsSelectedId,i=t.agents.some(s=>s.id===n);(!n||!i)&&(e.agentsSelectedId=t.defaultId??t.agents[0]?.id??null)}}catch(t){e.agentsError=String(t)}finally{e.agentsLoading=!1}}}const oa=/<\s*\/?\s*(?:think(?:ing)?|thought|antthinking|final)\b/i,Ae=/<\s*\/?\s*final\b[^<>]*>/gi,ln=/<\s*(\/?)\s*(?:think(?:ing)?|thought|antthinking)\b[^<>]*>/gi;function rn(e){const t=[],n=/(^|\n)(```|~~~)[^\n]*\n[\s\S]*?(?:\n\2(?:\n|$)|$)/g;for(const s of e.matchAll(n)){const a=(s.index??0)+s[1].length;t.push({start:a,end:a+s[0].length-s[1].length})}const i=/`+[^`]+`+/g;for(const s of e.matchAll(i)){const a=s.index??0,l=a+s[0].length;t.some(d=>a>=d.start&&l<=d.end)||t.push({start:a,end:l})}return t.sort((s,a)=>s.start-a.start),t}function cn(e,t){return t.some(n=>e>=n.start&&e<n.end)}function la(e,t){return e.trimStart()}function ra(e,t){if(!e||!oa.test(e))return e;let n=e;if(Ae.test(n)){Ae.lastIndex=0;const r=[],d=rn(n);for(const g of n.matchAll(Ae)){const p=g.index??0;r.push({start:p,length:g[0].length,inCode:cn(p,d)})}for(let g=r.length-1;g>=0;g--){const p=r[g];p.inCode||(n=n.slice(0,p.start)+n.slice(p.start+p.length))}}else Ae.lastIndex=0;const i=rn(n);ln.lastIndex=0;let s="",a=0,l=!1;for(const r of n.matchAll(ln)){const d=r.index??0,g=r[1]==="/";cn(d,i)||(l?g&&(l=!1):(s+=n.slice(a,d),g||(l=!0)),a=d+r[0].length)}return s+=n.slice(a),la(s)}function he(e){return!e&&e!==0?"n/a":new Date(e).toLocaleString()}function T(e){if(!e&&e!==0)return"n/a";const t=Date.now()-e;if(t<0)return"just now";const n=Math.round(t/1e3);if(n<60)return`${n}s ago`;const i=Math.round(n/60);if(i<60)return`${i}m ago`;const s=Math.round(i/60);return s<48?`${s}h ago`:`${Math.round(s/24)}d ago`}function vi(e){if(!e&&e!==0)return"n/a";if(e<1e3)return`${e}ms`;const t=Math.round(e/1e3);if(t<60)return`${t}s`;const n=Math.round(t/60);if(n<60)return`${n}m`;const i=Math.round(n/60);return i<48?`${i}h`:`${Math.round(i/24)}d`}function mt(e){return!e||e.length===0?"none":e.filter(t=>!!(t&&t.trim())).join(", ")}function yt(e,t=120){return e.length<=t?e:`${e.slice(0,Math.max(0,t-1))}…`}function pi(e,t){return e.length<=t?{text:e,truncated:!1,total:e.length}:{text:e.slice(0,Math.max(0,t)),truncated:!0,total:e.length}}function Re(e,t){const n=Number(e);return Number.isFinite(n)?n:t}function Ze(e){return ra(e)}async function ke(e){if(!(!e.client||!e.connected))try{const t=await e.client.request("cron.status",{});e.cronStatus=t}catch(t){e.cronError=String(t)}}async function je(e){if(!(!e.client||!e.connected)&&!e.cronLoading){e.cronLoading=!0,e.cronError=null;try{const t=await e.client.request("cron.list",{includeDisabled:!0});e.cronJobs=Array.isArray(t.jobs)?t.jobs:[]}catch(t){e.cronError=String(t)}finally{e.cronLoading=!1}}}function ca(e){if(e.scheduleKind==="at"){const n=Date.parse(e.scheduleAt);if(!Number.isFinite(n))throw new Error("Invalid run time.");return{kind:"at",atMs:n}}if(e.scheduleKind==="every"){const n=Re(e.everyAmount,0);if(n<=0)throw new Error("Invalid interval amount.");const i=e.everyUnit;return{kind:"every",everyMs:n*(i==="minutes"?6e4:i==="hours"?36e5:864e5)}}const t=e.cronExpr.trim();if(!t)throw new Error("Cron expression required.");return{kind:"cron",expr:t,tz:e.cronTz.trim()||void 0}}function da(e){if(e.payloadKind==="systemEvent"){const s=e.payloadText.trim();if(!s)throw new Error("System event text required.");return{kind:"systemEvent",text:s}}const t=e.payloadText.trim();if(!t)throw new Error("Agent message required.");const n={kind:"agentTurn",message:t};e.deliver&&(n.deliver=!0),e.channel&&(n.channel=e.channel),e.to.trim()&&(n.to=e.to.trim());const i=Re(e.timeoutSeconds,0);return i>0&&(n.timeoutSeconds=i),n}async function ua(e){if(!(!e.client||!e.connected||e.cronBusy)){e.cronBusy=!0,e.cronError=null;try{const t=ca(e.cronForm),n=da(e.cronForm),i=e.cronForm.agentId.trim(),s={name:e.cronForm.name.trim(),description:e.cronForm.description.trim()||void 0,agentId:i||void 0,enabled:e.cronForm.enabled,schedule:t,sessionTarget:e.cronForm.sessionTarget,wakeMode:e.cronForm.wakeMode,payload:n,isolation:e.cronForm.postToMainPrefix.trim()&&e.cronForm.sessionTarget==="isolated"?{postToMainPrefix:e.cronForm.postToMainPrefix.trim()}:void 0};if(!s.name)throw new Error("Name required.");await e.client.request("cron.add",s),e.cronForm={...e.cronForm,name:"",description:"",payloadText:""},await je(e),await ke(e)}catch(t){e.cronError=String(t)}finally{e.cronBusy=!1}}}async function ga(e,t,n){if(!(!e.client||!e.connected||e.cronBusy)){e.cronBusy=!0,e.cronError=null;try{await e.client.request("cron.update",{id:t.id,patch:{enabled:n}}),await je(e),await ke(e)}catch(i){e.cronError=String(i)}finally{e.cronBusy=!1}}}async function fa(e,t){if(!(!e.client||!e.connected||e.cronBusy)){e.cronBusy=!0,e.cronError=null;try{await e.client.request("cron.run",{id:t.id,mode:"force"}),await hi(e,t.id)}catch(n){e.cronError=String(n)}finally{e.cronBusy=!1}}}async function va(e,t){if(!(!e.client||!e.connected||e.cronBusy)){e.cronBusy=!0,e.cronError=null;try{await e.client.request("cron.remove",{id:t.id}),e.cronRunsJobId===t.id&&(e.cronRunsJobId=null,e.cronRuns=[]),await je(e),await ke(e)}catch(n){e.cronError=String(n)}finally{e.cronBusy=!1}}}async function hi(e,t){if(!(!e.client||!e.connected))try{const n=await e.client.request("cron.runs",{id:t,limit:50});e.cronRunsJobId=t,e.cronRuns=Array.isArray(n.entries)?n.entries:[]}catch(n){e.cronError=String(n)}}const mi="openclaw.device.auth.v1";function Kt(e){return e.trim()}function pa(e){if(!Array.isArray(e))return[];const t=new Set;for(const n of e){const i=n.trim();i&&t.add(i)}return[...t].toSorted()}function Ut(){try{const e=window.localStorage.getItem(mi);if(!e)return null;const t=JSON.parse(e);return!t||t.version!==1||!t.deviceId||typeof t.deviceId!="string"||!t.tokens||typeof t.tokens!="object"?null:t}catch{return null}}function yi(e){try{window.localStorage.setItem(mi,JSON.stringify(e))}catch{}}function ha(e){const t=Ut();if(!t||t.deviceId!==e.deviceId)return null;const n=Kt(e.role),i=t.tokens[n];return!i||typeof i.token!="string"?null:i}function bi(e){const t=Kt(e.role),n={version:1,deviceId:e.deviceId,tokens:{}},i=Ut();i&&i.deviceId===e.deviceId&&(n.tokens={...i.tokens});const s={token:e.token,role:t,scopes:pa(e.scopes),updatedAtMs:Date.now()};return n.tokens[t]=s,yi(n),s}function wi(e){const t=Ut();if(!t||t.deviceId!==e.deviceId)return;const n=Kt(e.role);if(!t.tokens[n])return;const i={...t,tokens:{...t.tokens}};delete i.tokens[n],yi(i)}const $i={p:0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffedn,n:0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3edn,h:8n,a:0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffecn,d:0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3n,Gx:0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51an,Gy:0x6666666666666666666666666666666666666666666666666666666666666658n},{p:F,n:Me,Gx:dn,Gy:un,a:et,d:tt,h:ma}=$i,ne=32,jt=64,ya=(...e)=>{"captureStackTrace"in Error&&typeof Error.captureStackTrace=="function"&&Error.captureStackTrace(...e)},E=(e="")=>{const t=new Error(e);throw ya(t,E),t},ba=e=>typeof e=="bigint",wa=e=>typeof e=="string",$a=e=>e instanceof Uint8Array||ArrayBuffer.isView(e)&&e.constructor.name==="Uint8Array",Q=(e,t,n="")=>{const i=$a(e),s=e?.length,a=t!==void 0;if(!i||a&&s!==t){const l=n&&`"${n}" `,r=a?` of length ${t}`:"",d=i?`length=${s}`:`type=${typeof e}`;E(l+"expected Uint8Array"+r+", got "+d)}return e},He=e=>new Uint8Array(e),Si=e=>Uint8Array.from(e),ki=(e,t)=>e.toString(16).padStart(t,"0"),xi=e=>Array.from(Q(e)).map(t=>ki(t,2)).join(""),H={_0:48,_9:57,A:65,F:70,a:97,f:102},gn=e=>{if(e>=H._0&&e<=H._9)return e-H._0;if(e>=H.A&&e<=H.F)return e-(H.A-10);if(e>=H.a&&e<=H.f)return e-(H.a-10)},Ai=e=>{const t="hex invalid";if(!wa(e))return E(t);const n=e.length,i=n/2;if(n%2)return E(t);const s=He(i);for(let a=0,l=0;a<i;a++,l+=2){const r=gn(e.charCodeAt(l)),d=gn(e.charCodeAt(l+1));if(r===void 0||d===void 0)return E(t);s[a]=r*16+d}return s},Ci=()=>globalThis?.crypto,Sa=()=>Ci()?.subtle??E("crypto.subtle must be defined, consider polyfill"),me=(...e)=>{const t=He(e.reduce((i,s)=>i+Q(s).length,0));let n=0;return e.forEach(i=>{t.set(i,n),n+=i.length}),t},ka=(e=ne)=>Ci().getRandomValues(He(e)),Pe=BigInt,Z=(e,t,n,i="bad number: out of range")=>ba(e)&&t<=e&&e<n?e:E(i),A=(e,t=F)=>{const n=e%t;return n>=0n?n:t+n},Ii=e=>A(e,Me),xa=(e,t)=>{(e===0n||t<=0n)&&E("no inverse n="+e+" mod="+t);let n=A(e,t),i=t,s=0n,a=1n;for(;n!==0n;){const l=i/n,r=i%n,d=s-a*l;i=n,n=r,s=a,a=d}return i===1n?A(s,t):E("no inverse")},Aa=e=>{const t=Ei[e];return typeof t!="function"&&E("hashes."+e+" not set"),t},nt=e=>e instanceof B?e:E("Point expected"),bt=2n**256n;class B{static BASE;static ZERO;X;Y;Z;T;constructor(t,n,i,s){const a=bt;this.X=Z(t,0n,a),this.Y=Z(n,0n,a),this.Z=Z(i,1n,a),this.T=Z(s,0n,a),Object.freeze(this)}static CURVE(){return $i}static fromAffine(t){return new B(t.x,t.y,1n,A(t.x*t.y))}static fromBytes(t,n=!1){const i=tt,s=Si(Q(t,ne)),a=t[31];s[31]=a&-129;const l=_i(s);Z(l,0n,n?bt:F);const d=A(l*l),g=A(d-1n),p=A(i*d+1n);let{isValid:v,value:c}=Ia(g,p);v||E("bad point: y not sqrt");const u=(c&1n)===1n,b=(a&128)!==0;return!n&&c===0n&&b&&E("bad point: x==0, isLastByteOdd"),b!==u&&(c=A(-c)),new B(c,l,1n,A(c*l))}static fromHex(t,n){return B.fromBytes(Ai(t),n)}get x(){return this.toAffine().x}get y(){return this.toAffine().y}assertValidity(){const t=et,n=tt,i=this;if(i.is0())return E("bad point: ZERO");const{X:s,Y:a,Z:l,T:r}=i,d=A(s*s),g=A(a*a),p=A(l*l),v=A(p*p),c=A(d*t),u=A(p*A(c+g)),b=A(v+A(n*A(d*g)));if(u!==b)return E("bad point: equation left != right (1)");const w=A(s*a),$=A(l*r);return w!==$?E("bad point: equation left != right (2)"):this}equals(t){const{X:n,Y:i,Z:s}=this,{X:a,Y:l,Z:r}=nt(t),d=A(n*r),g=A(a*s),p=A(i*r),v=A(l*s);return d===g&&p===v}is0(){return this.equals(ae)}negate(){return new B(A(-this.X),this.Y,this.Z,A(-this.T))}double(){const{X:t,Y:n,Z:i}=this,s=et,a=A(t*t),l=A(n*n),r=A(2n*A(i*i)),d=A(s*a),g=t+n,p=A(A(g*g)-a-l),v=d+l,c=v-r,u=d-l,b=A(p*c),w=A(v*u),$=A(p*u),S=A(c*v);return new B(b,w,S,$)}add(t){const{X:n,Y:i,Z:s,T:a}=this,{X:l,Y:r,Z:d,T:g}=nt(t),p=et,v=tt,c=A(n*l),u=A(i*r),b=A(a*v*g),w=A(s*d),$=A((n+i)*(l+r)-c-u),S=A(w-b),k=A(w+b),C=A(u-p*c),L=A($*S),I=A(k*C),x=A($*C),_=A(S*k);return new B(L,I,_,x)}subtract(t){return this.add(nt(t).negate())}multiply(t,n=!0){if(!n&&(t===0n||this.is0()))return ae;if(Z(t,1n,Me),t===1n)return this;if(this.equals(ie))return Da(t).p;let i=ae,s=ie;for(let a=this;t>0n;a=a.double(),t>>=1n)t&1n?i=i.add(a):n&&(s=s.add(a));return i}multiplyUnsafe(t){return this.multiply(t,!1)}toAffine(){const{X:t,Y:n,Z:i}=this;if(this.equals(ae))return{x:0n,y:1n};const s=xa(i,F);A(i*s)!==1n&&E("invalid inverse");const a=A(t*s),l=A(n*s);return{x:a,y:l}}toBytes(){const{x:t,y:n}=this.assertValidity().toAffine(),i=Li(n);return i[31]|=t&1n?128:0,i}toHex(){return xi(this.toBytes())}clearCofactor(){return this.multiply(Pe(ma),!1)}isSmallOrder(){return this.clearCofactor().is0()}isTorsionFree(){let t=this.multiply(Me/2n,!1).double();return Me%2n&&(t=t.add(this)),t.is0()}}const ie=new B(dn,un,1n,A(dn*un)),ae=new B(0n,1n,1n,0n);B.BASE=ie;B.ZERO=ae;const Li=e=>Ai(ki(Z(e,0n,bt),jt)).reverse(),_i=e=>Pe("0x"+xi(Si(Q(e)).reverse())),O=(e,t)=>{let n=e;for(;t-- >0n;)n*=n,n%=F;return n},Ca=e=>{const n=e*e%F*e%F,i=O(n,2n)*n%F,s=O(i,1n)*e%F,a=O(s,5n)*s%F,l=O(a,10n)*a%F,r=O(l,20n)*l%F,d=O(r,40n)*r%F,g=O(d,80n)*d%F,p=O(g,80n)*d%F,v=O(p,10n)*a%F;return{pow_p_5_8:O(v,2n)*e%F,b2:n}},fn=0x2b8324804fc1df0b2b4d00993dfbd7a72f431806ad2fe478c4ee1b274a0ea0b0n,Ia=(e,t)=>{const n=A(t*t*t),i=A(n*n*t),s=Ca(e*i).pow_p_5_8;let a=A(e*n*s);const l=A(t*a*a),r=a,d=A(a*fn),g=l===e,p=l===A(-e),v=l===A(-e*fn);return g&&(a=r),(p||v)&&(a=d),(A(a)&1n)===1n&&(a=A(-a)),{isValid:g||p,value:a}},wt=e=>Ii(_i(e)),Ht=(...e)=>Ei.sha512Async(me(...e)),La=(...e)=>Aa("sha512")(me(...e)),Ti=e=>{const t=e.slice(0,ne);t[0]&=248,t[31]&=127,t[31]|=64;const n=e.slice(ne,jt),i=wt(t),s=ie.multiply(i),a=s.toBytes();return{head:t,prefix:n,scalar:i,point:s,pointBytes:a}},zt=e=>Ht(Q(e,ne)).then(Ti),_a=e=>Ti(La(Q(e,ne))),Ta=e=>zt(e).then(t=>t.pointBytes),Ea=e=>Ht(e.hashable).then(e.finish),Ma=(e,t,n)=>{const{pointBytes:i,scalar:s}=e,a=wt(t),l=ie.multiply(a).toBytes();return{hashable:me(l,i,n),finish:g=>{const p=Ii(a+wt(g)*s);return Q(me(l,Li(p)),jt)}}},Fa=async(e,t)=>{const n=Q(e),i=await zt(t),s=await Ht(i.prefix,n);return Ea(Ma(i,s,n))},Ei={sha512Async:async e=>{const t=Sa(),n=me(e);return He(await t.digest("SHA-512",n.buffer))},sha512:void 0},Ra=(e=ka(ne))=>e,Pa={getExtendedPublicKeyAsync:zt,getExtendedPublicKey:_a,randomSecretKey:Ra},Ne=8,Na=256,Mi=Math.ceil(Na/Ne)+1,$t=2**(Ne-1),Ba=()=>{const e=[];let t=ie,n=t;for(let i=0;i<Mi;i++){n=t,e.push(n);for(let s=1;s<$t;s++)n=n.add(t),e.push(n);t=n.double()}return e};let vn;const pn=(e,t)=>{const n=t.negate();return e?n:t},Da=e=>{const t=vn||(vn=Ba());let n=ae,i=ie;const s=2**Ne,a=s,l=Pe(s-1),r=Pe(Ne);for(let d=0;d<Mi;d++){let g=Number(e&l);e>>=r,g>$t&&(g-=a,e+=1n);const p=d*$t,v=p,c=p+Math.abs(g)-1,u=d%2!==0,b=g<0;g===0?i=i.add(pn(u,t[v])):n=n.add(pn(b,t[c]))}return e!==0n&&E("invalid wnaf"),{p:n,f:i}},it="openclaw-device-identity-v1";function St(e){let t="";for(const n of e)t+=String.fromCharCode(n);return btoa(t).replaceAll("+","-").replaceAll("/","_").replace(/=+$/g,"")}function Fi(e){const t=e.replaceAll("-","+").replaceAll("_","/"),n=t+"=".repeat((4-t.length%4)%4),i=atob(n),s=new Uint8Array(i.length);for(let a=0;a<i.length;a+=1)s[a]=i.charCodeAt(a);return s}function Oa(e){return Array.from(e).map(t=>t.toString(16).padStart(2,"0")).join("")}async function Ri(e){const t=await crypto.subtle.digest("SHA-256",e);return Oa(new Uint8Array(t))}async function Ka(){const e=Pa.randomSecretKey(),t=await Ta(e);return{deviceId:await Ri(t),publicKey:St(t),privateKey:St(e)}}async function Vt(){try{const n=localStorage.getItem(it);if(n){const i=JSON.parse(n);if(i?.version===1&&typeof i.deviceId=="string"&&typeof i.publicKey=="string"&&typeof i.privateKey=="string"){const s=await Ri(Fi(i.publicKey));if(s!==i.deviceId){const a={...i,deviceId:s};return localStorage.setItem(it,JSON.stringify(a)),{deviceId:s,publicKey:i.publicKey,privateKey:i.privateKey}}return{deviceId:i.deviceId,publicKey:i.publicKey,privateKey:i.privateKey}}}}catch{}const e=await Ka(),t={version:1,deviceId:e.deviceId,publicKey:e.publicKey,privateKey:e.privateKey,createdAtMs:Date.now()};return localStorage.setItem(it,JSON.stringify(t)),e}async function Ua(e,t){const n=Fi(e),i=new TextEncoder().encode(t),s=await Fa(i,n);return St(s)}async function J(e,t){if(!(!e.client||!e.connected)&&!e.devicesLoading){e.devicesLoading=!0,t?.quiet||(e.devicesError=null);try{const n=await e.client.request("device.pair.list",{});e.devicesList={pending:Array.isArray(n?.pending)?n.pending:[],paired:Array.isArray(n?.paired)?n.paired:[]}}catch(n){t?.quiet||(e.devicesError=String(n))}finally{e.devicesLoading=!1}}}async function ja(e,t){if(!(!e.client||!e.connected))try{await e.client.request("device.pair.approve",{requestId:t}),await J(e)}catch(n){e.devicesError=String(n)}}async function Ha(e,t){if(!(!e.client||!e.connected||!window.confirm("Reject this device pairing request?")))try{await e.client.request("device.pair.reject",{requestId:t}),await J(e)}catch(i){e.devicesError=String(i)}}async function za(e,t){if(!(!e.client||!e.connected))try{const n=await e.client.request("device.token.rotate",t);if(n?.token){const i=await Vt(),s=n.role??t.role;(n.deviceId===i.deviceId||t.deviceId===i.deviceId)&&bi({deviceId:i.deviceId,role:s,token:n.token,scopes:n.scopes??t.scopes??[]}),window.prompt("New device token (copy and store securely):",n.token)}await J(e)}catch(n){e.devicesError=String(n)}}async function Va(e,t){if(!(!e.client||!e.connected||!window.confirm(`Revoke token for ${t.deviceId} (${t.role})?`)))try{await e.client.request("device.token.revoke",t);const i=await Vt();t.deviceId===i.deviceId&&wi({deviceId:i.deviceId,role:t.role}),await J(e)}catch(i){e.devicesError=String(i)}}function qa(e){if(!e||e.kind==="gateway")return{method:"exec.approvals.get",params:{}};const t=e.nodeId.trim();return t?{method:"exec.approvals.node.get",params:{nodeId:t}}:null}function Ga(e,t){if(!e||e.kind==="gateway")return{method:"exec.approvals.set",params:t};const n=e.nodeId.trim();return n?{method:"exec.approvals.node.set",params:{...t,nodeId:n}}:null}async function qt(e,t){if(!(!e.client||!e.connected)&&!e.execApprovalsLoading){e.execApprovalsLoading=!0,e.lastError=null;try{const n=qa(t);if(!n){e.lastError="Select a node before loading exec approvals.";return}const i=await e.client.request(n.method,n.params);Wa(e,i)}catch(n){e.lastError=String(n)}finally{e.execApprovalsLoading=!1}}}function Wa(e,t){e.execApprovalsSnapshot=t,e.execApprovalsDirty||(e.execApprovalsForm=te(t.file??{}))}async function Ya(e,t){if(!(!e.client||!e.connected)){e.execApprovalsSaving=!0,e.lastError=null;try{const n=e.execApprovalsSnapshot?.hash;if(!n){e.lastError="Exec approvals hash missing; reload and retry.";return}const i=e.execApprovalsForm??e.execApprovalsSnapshot?.file??{},s=Ga(t,{file:i,baseHash:n});if(!s){e.lastError="Select a node before saving exec approvals.";return}await e.client.request(s.method,s.params),e.execApprovalsDirty=!1,await qt(e,t)}catch(n){e.lastError=String(n)}finally{e.execApprovalsSaving=!1}}}function Qa(e,t,n){const i=te(e.execApprovalsForm??e.execApprovalsSnapshot?.file??{});ai(i,t,n),e.execApprovalsForm=i,e.execApprovalsDirty=!0}function Ja(e,t){const n=te(e.execApprovalsForm??e.execApprovalsSnapshot?.file??{});oi(n,t),e.execApprovalsForm=n,e.execApprovalsDirty=!0}async function Gt(e){if(!(!e.client||!e.connected)&&!e.presenceLoading){e.presenceLoading=!0,e.presenceError=null,e.presenceStatus=null;try{const t=await e.client.request("system-presence",{});Array.isArray(t)?(e.presenceEntries=t,e.presenceStatus=t.length===0?"No instances yet.":null):(e.presenceEntries=[],e.presenceStatus="No presence payload.")}catch(t){e.presenceError=String(t)}finally{e.presenceLoading=!1}}}async function z(e,t){if(!(!e.client||!e.connected)&&!e.sessionsLoading){e.sessionsLoading=!0,e.sessionsError=null;try{const n=t?.includeGlobal??e.sessionsIncludeGlobal,i=t?.includeUnknown??e.sessionsIncludeUnknown,s=t?.activeMinutes??Re(e.sessionsFilterActive,0),a=t?.limit??Re(e.sessionsFilterLimit,0),l={includeGlobal:n,includeUnknown:i};s>0&&(l.activeMinutes=s),a>0&&(l.limit=a);const r=await e.client.request("sessions.list",l);r&&(e.sessionsResult=r)}catch(n){e.sessionsError=String(n)}finally{e.sessionsLoading=!1}}}async function Xa(e,t,n){if(!e.client||!e.connected)return;const i={key:t};"label"in n&&(i.label=n.label),"thinkingLevel"in n&&(i.thinkingLevel=n.thinkingLevel),"verboseLevel"in n&&(i.verboseLevel=n.verboseLevel),"reasoningLevel"in n&&(i.reasoningLevel=n.reasoningLevel);try{await e.client.request("sessions.patch",i),await z(e)}catch(s){e.sessionsError=String(s)}}async function Za(e,t){if(!(!e.client||!e.connected||e.sessionsLoading||!window.confirm(`Delete session "${t}"?

Deletes the session entry and archives its transcript.`))){e.sessionsLoading=!0,e.sessionsError=null;try{await e.client.request("sessions.delete",{key:t,deleteTranscript:!0}),await z(e)}catch(i){e.sessionsError=String(i)}finally{e.sessionsLoading=!1}}}function le(e,t,n){if(!t.trim())return;const i={...e.skillMessages};n?i[t]=n:delete i[t],e.skillMessages=i}function ze(e){return e instanceof Error?e.message:String(e)}async function se(e,t){if(t?.clearMessages&&Object.keys(e.skillMessages).length>0&&(e.skillMessages={}),!(!e.client||!e.connected)&&!e.skillsLoading){e.skillsLoading=!0,e.skillsError=null;try{const n=await e.client.request("skills.status",{});n&&(e.skillsReport=n)}catch(n){e.skillsError=ze(n)}finally{e.skillsLoading=!1}}}function eo(e,t,n){e.skillEdits={...e.skillEdits,[t]:n}}async function to(e,t,n){if(!(!e.client||!e.connected)){e.skillsBusyKey=t,e.skillsError=null;try{await e.client.request("skills.update",{skillKey:t,enabled:n}),await se(e),le(e,t,{kind:"success",message:n?"Skill enabled":"Skill disabled"})}catch(i){const s=ze(i);e.skillsError=s,le(e,t,{kind:"error",message:s})}finally{e.skillsBusyKey=null}}}async function no(e,t){if(!(!e.client||!e.connected)){e.skillsBusyKey=t,e.skillsError=null;try{const n=e.skillEdits[t]??"";await e.client.request("skills.update",{skillKey:t,apiKey:n}),await se(e),le(e,t,{kind:"success",message:"API key saved"})}catch(n){const i=ze(n);e.skillsError=i,le(e,t,{kind:"error",message:i})}finally{e.skillsBusyKey=null}}}async function io(e,t,n,i){if(!(!e.client||!e.connected)){e.skillsBusyKey=t,e.skillsError=null;try{const s=await e.client.request("skills.install",{name:n,installId:i,timeoutMs:12e4});await se(e);const a=s?.message??"Skill installed";le(e,t,{kind:"success",message:a}),e.showToast?.("success",a)}catch(s){const a=ze(s);e.skillsError=a,le(e,t,{kind:"error",message:a}),e.showToast?.("error",`Failed to install skill: ${a}`)}finally{e.skillsBusyKey=null}}}const Fe=[{label:"Chat",tabs:["chat"]},{label:"Control",tabs:["overview","channels","instances","sessions","cron"]},{label:"Agent",tabs:["agents","skills","nodes"]},{label:"Settings",tabs:["config","debug","logs"]}],Pi={agents:"/agents",overview:"/overview",channels:"/channels",instances:"/instances",sessions:"/sessions",cron:"/cron",skills:"/skills",nodes:"/nodes",chat:"/chat",config:"/config",debug:"/debug",logs:"/logs"},Ni=new Map(Object.entries(Pi).map(([e,t])=>[t,e]));function Ve(e){if(!e)return"";let t=e.trim();return t.startsWith("/")||(t=`/${t}`),t==="/"?"":(t.endsWith("/")&&(t=t.slice(0,-1)),t)}function ye(e){if(!e)return"/";let t=e.trim();return t.startsWith("/")||(t=`/${t}`),t.length>1&&t.endsWith("/")&&(t=t.slice(0,-1)),t}function Wt(e,t=""){const n=Ve(t),i=Pi[e];return n?`${n}${i}`:i}function Bi(e,t=""){const n=Ve(t);let i=e||"/";n&&(i===n?i="/":i.startsWith(`${n}/`)&&(i=i.slice(n.length)));let s=ye(i).toLowerCase();return s.endsWith("/index.html")&&(s="/"),s==="/"?"chat":Ni.get(s)??null}function so(e){let t=ye(e);if(t.endsWith("/index.html")&&(t=ye(t.slice(0,-11))),t==="/")return"";const n=t.split("/").filter(Boolean);if(n.length===0)return"";for(let i=0;i<n.length;i++){const s=`/${n.slice(i).join("/")}`.toLowerCase();if(Ni.has(s)){const a=n.slice(0,i);return a.length?`/${a.join("/")}`:""}}return`/${n.join("/")}`}function ao(e){switch(e){case"agents":return"folder";case"chat":return"messageSquare";case"overview":return"barChart";case"channels":return"link";case"instances":return"radio";case"sessions":return"fileText";case"cron":return"loader";case"skills":return"zap";case"nodes":return"monitor";case"config":return"settings";case"debug":return"bug";case"logs":return"scrollText";default:return"folder"}}function be(e){switch(e){case"agents":return"Agents";case"overview":return"Overview";case"channels":return"Channels";case"instances":return"Instances";case"sessions":return"Sessions";case"cron":return"Cron Jobs";case"skills":return"Skills";case"nodes":return"Nodes";case"chat":return"Chat";case"config":return"Config";case"debug":return"Debug";case"logs":return"Logs";default:return"Control"}}function oo(e){switch(e){case"agents":return"Manage agent workspaces, tools, and identities.";case"overview":return"Gateway status, entry points, and a fast health read.";case"channels":return"Manage channels and settings.";case"instances":return"Presence beacons from connected clients and nodes.";case"sessions":return"Inspect active sessions and adjust per-session defaults.";case"cron":return"Schedule wakeups and recurring agent runs.";case"skills":return"Manage skill availability and API key injection.";case"nodes":return"Paired devices, capabilities, and command exposure.";case"chat":return"Direct gateway chat session for quick interventions.";case"config":return"Edit ~/.openclaw/openclaw.json safely.";case"debug":return"Gateway snapshots, events, and manual RPC calls.";case"logs":return"Live tail of the gateway file logs.";default:return""}}const Di="openclaw.control.settings.v1";function lo(){const t={gatewayUrl:`${location.protocol==="https:"?"wss":"ws"}://${location.host}`,token:"",sessionKey:"main",lastActiveSessionKey:"main",theme:"system",chatFocusMode:!1,chatShowThinking:!0,splitRatio:.6,navCollapsed:!1,navGroupsCollapsed:{}};try{const n=localStorage.getItem(Di);if(!n)return t;const i=JSON.parse(n);return{gatewayUrl:typeof i.gatewayUrl=="string"&&i.gatewayUrl.trim()?i.gatewayUrl.trim():t.gatewayUrl,token:typeof i.token=="string"?i.token:t.token,sessionKey:typeof i.sessionKey=="string"&&i.sessionKey.trim()?i.sessionKey.trim():t.sessionKey,lastActiveSessionKey:typeof i.lastActiveSessionKey=="string"&&i.lastActiveSessionKey.trim()?i.lastActiveSessionKey.trim():typeof i.sessionKey=="string"&&i.sessionKey.trim()||t.lastActiveSessionKey,theme:i.theme==="light"||i.theme==="dark"||i.theme==="system"?i.theme:t.theme,chatFocusMode:typeof i.chatFocusMode=="boolean"?i.chatFocusMode:t.chatFocusMode,chatShowThinking:typeof i.chatShowThinking=="boolean"?i.chatShowThinking:t.chatShowThinking,splitRatio:typeof i.splitRatio=="number"&&i.splitRatio>=.4&&i.splitRatio<=.7?i.splitRatio:t.splitRatio,navCollapsed:typeof i.navCollapsed=="boolean"?i.navCollapsed:t.navCollapsed,navGroupsCollapsed:typeof i.navGroupsCollapsed=="object"&&i.navGroupsCollapsed!==null?i.navGroupsCollapsed:t.navGroupsCollapsed}}catch{return t}}function ro(e){localStorage.setItem(Di,JSON.stringify(e))}function co(){return typeof window>"u"||typeof window.matchMedia!="function"||window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}function Yt(e){return e==="system"?co():e}const Ce=e=>Number.isNaN(e)?.5:e<=0?0:e>=1?1:e,uo=()=>typeof window>"u"||typeof window.matchMedia!="function"?!1:window.matchMedia("(prefers-reduced-motion: reduce)").matches??!1,Ie=e=>{e.classList.remove("theme-transition"),e.style.removeProperty("--theme-switch-x"),e.style.removeProperty("--theme-switch-y")},go=({nextTheme:e,applyTheme:t,context:n,currentTheme:i})=>{if(i===e)return;const s=globalThis.document??null;if(!s){t();return}const a=s.documentElement,l=s,r=uo();if(!!l.startViewTransition&&!r){let g=.5,p=.5;if(n?.pointerClientX!==void 0&&n?.pointerClientY!==void 0&&typeof window<"u")g=Ce(n.pointerClientX/window.innerWidth),p=Ce(n.pointerClientY/window.innerHeight);else if(n?.element){const v=n.element.getBoundingClientRect();v.width>0&&v.height>0&&typeof window<"u"&&(g=Ce((v.left+v.width/2)/window.innerWidth),p=Ce((v.top+v.height/2)/window.innerHeight))}a.style.setProperty("--theme-switch-x",`${g*100}%`),a.style.setProperty("--theme-switch-y",`${p*100}%`),a.classList.add("theme-transition");try{const v=l.startViewTransition?.(()=>{t()});v?.finished?v.finished.finally(()=>Ie(a)):Ie(a)}catch{Ie(a),t()}return}t(),Ie(a)};function Y(e,t){const n={...t,lastActiveSessionKey:t.lastActiveSessionKey?.trim()||t.sessionKey.trim()||"main"};e.settings=n,ro(n),t.theme!==e.theme&&(e.theme=t.theme,qe(e,Yt(t.theme))),e.applySessionKey=e.settings.lastActiveSessionKey}function Oi(e,t){const n=t.trim();n&&e.settings.lastActiveSessionKey!==n&&Y(e,{...e.settings,lastActiveSessionKey:n})}function fo(e){if(!window.location.search)return;const t=new URLSearchParams(window.location.search),n=t.get("token"),i=t.get("password"),s=t.get("session"),a=t.get("gatewayUrl");let l=!1;if(n!=null){const d=n.trim();d&&d!==e.settings.token&&Y(e,{...e.settings,token:d}),t.delete("token"),l=!0}if(i!=null){const d=i.trim();d&&(e.password=d),t.delete("password"),l=!0}if(s!=null){const d=s.trim();d&&(e.sessionKey=d,Y(e,{...e.settings,sessionKey:d,lastActiveSessionKey:d}))}if(a!=null){const d=a.trim();d&&d!==e.settings.gatewayUrl&&(e.pendingGatewayUrl=d),t.delete("gatewayUrl"),l=!0}if(!l)return;const r=new URL(window.location.href);r.search=t.toString(),window.history.replaceState({},"",r.toString())}function vo(e,t){e.tab!==t&&(e.tab=t),t==="chat"&&(e.chatHasAutoScrolled=!1),t==="logs"?Nt(e):Bt(e),t==="debug"?Dt(e):Ot(e),Qt(e),Ui(e,t,!1)}function po(e,t,n){go({nextTheme:t,applyTheme:()=>{e.theme=t,Y(e,{...e.settings,theme:t}),qe(e,Yt(t))},context:n,currentTheme:e.theme})}async function Qt(e){if(e.tab==="overview"&&await ji(e),e.tab==="channels"&&await ko(e),e.tab==="instances"&&await Gt(e),e.tab==="sessions"&&await z(e),e.tab==="cron"&&await Be(e),e.tab==="skills"&&await se(e),e.tab==="agents"){await pe(e),await N(e);const t=e.agentsList?.agents?.map(i=>i.id)??[];t.length>0&&fi(e,t);const n=e.agentsSelectedId??e.agentsList?.defaultId??e.agentsList?.agents?.[0]?.id;n&&(gi(e,n),e.agentsPanel==="skills"&&Ee(e,n),e.agentsPanel==="channels"&&R(e,!1),e.agentsPanel==="cron"&&Be(e))}e.tab==="nodes"&&(await Ue(e),await J(e),await N(e),await qt(e)),e.tab==="chat"&&(await Yi(e),Se(e,!e.chatHasAutoScrolled)),e.tab==="config"&&(await li(e),await N(e)),e.tab==="debug"&&(await Ke(e),e.eventLog=e.eventLogBuffer),e.tab==="logs"&&(e.logsAtBottom=!0,await ve(e,{reset:!0}),ui(e,!0))}function ho(){if(typeof window>"u")return"";const e=window.__OPENCLAW_CONTROL_UI_BASE_PATH__;return typeof e=="string"&&e.trim()?Ve(e):so(window.location.pathname)}function mo(e){e.theme=e.settings.theme??"system",qe(e,Yt(e.theme))}function qe(e,t){if(e.themeResolved=t,typeof document>"u")return;const n=document.documentElement;n.dataset.theme=t,n.style.colorScheme=t}function yo(e){if(typeof window>"u"||typeof window.matchMedia!="function")return;if(e.themeMedia=window.matchMedia("(prefers-color-scheme: dark)"),e.themeMediaHandler=n=>{e.theme==="system"&&qe(e,n.matches?"dark":"light")},typeof e.themeMedia.addEventListener=="function"){e.themeMedia.addEventListener("change",e.themeMediaHandler);return}e.themeMedia.addListener(e.themeMediaHandler)}function bo(e){if(!e.themeMedia||!e.themeMediaHandler)return;if(typeof e.themeMedia.removeEventListener=="function"){e.themeMedia.removeEventListener("change",e.themeMediaHandler);return}e.themeMedia.removeListener(e.themeMediaHandler),e.themeMedia=null,e.themeMediaHandler=null}function wo(e,t){if(typeof window>"u")return;const n=Bi(window.location.pathname,e.basePath)??"chat";Ki(e,n),Ui(e,n,t)}function $o(e){if(typeof window>"u")return;const t=Bi(window.location.pathname,e.basePath);if(!t)return;const i=new URL(window.location.href).searchParams.get("session")?.trim();i&&(e.sessionKey=i,Y(e,{...e.settings,sessionKey:i,lastActiveSessionKey:i})),Ki(e,t)}function Ki(e,t){e.tab!==t&&(e.tab=t),t==="chat"&&(e.chatHasAutoScrolled=!1),t==="logs"?Nt(e):Bt(e),t==="debug"?Dt(e):Ot(e),e.connected&&Qt(e)}function Ui(e,t,n){if(typeof window>"u")return;const i=ye(Wt(t,e.basePath)),s=ye(window.location.pathname),a=new URL(window.location.href);t==="chat"&&e.sessionKey?a.searchParams.set("session",e.sessionKey):a.searchParams.delete("session"),s!==i&&(a.pathname=i),n?window.history.replaceState({},"",a.toString()):window.history.pushState({},"",a.toString())}function So(e,t,n){if(typeof window>"u")return;const i=new URL(window.location.href);i.searchParams.set("session",t),window.history.replaceState({},"",i.toString())}async function ji(e){await Promise.all([R(e,!1),Gt(e),z(e),ke(e),Ke(e)])}async function ko(e){await Promise.all([R(e,!0),li(e),N(e)])}async function Be(e){await Promise.all([R(e,!1),ke(e),je(e)])}const hn=50,xo=80,Ao=12e4;function Co(e){if(!e||typeof e!="object")return null;const t=e;if(typeof t.text=="string")return t.text;const n=t.content;if(!Array.isArray(n))return null;const i=n.map(s=>{if(!s||typeof s!="object")return null;const a=s;return a.type==="text"&&typeof a.text=="string"?a.text:null}).filter(s=>!!s);return i.length===0?null:i.join(`
`)}function mn(e){if(e==null)return null;if(typeof e=="number"||typeof e=="boolean")return String(e);const t=Co(e);let n;if(typeof e=="string")n=e;else if(t)n=t;else try{n=JSON.stringify(e,null,2)}catch{n=String(e)}const i=pi(n,Ao);return i.truncated?`${i.text}

… truncated (${i.total} chars, showing first ${i.text.length}).`:i.text}function Io(e){const t=[];return t.push({type:"toolcall",name:e.name,arguments:e.args??{}}),e.output&&t.push({type:"toolresult",name:e.name,text:e.output}),{role:"assistant",toolCallId:e.toolCallId,runId:e.runId,content:t,timestamp:e.startedAt}}function Lo(e){if(e.toolStreamOrder.length<=hn)return;const t=e.toolStreamOrder.length-hn,n=e.toolStreamOrder.splice(0,t);for(const i of n)e.toolStreamById.delete(i)}function _o(e){e.chatToolMessages=e.toolStreamOrder.map(t=>e.toolStreamById.get(t)?.message).filter(t=>!!t)}function kt(e){e.toolStreamSyncTimer!=null&&(clearTimeout(e.toolStreamSyncTimer),e.toolStreamSyncTimer=null),_o(e)}function To(e,t=!1){if(t){kt(e);return}e.toolStreamSyncTimer==null&&(e.toolStreamSyncTimer=window.setTimeout(()=>kt(e),xo))}function Ge(e){e.toolStreamById.clear(),e.toolStreamOrder=[],e.chatToolMessages=[],kt(e)}const Eo=5e3;function Mo(e,t){const n=t.data??{},i=typeof n.phase=="string"?n.phase:"";e.compactionClearTimer!=null&&(window.clearTimeout(e.compactionClearTimer),e.compactionClearTimer=null),i==="start"?e.compactionStatus={active:!0,startedAt:Date.now(),completedAt:null}:i==="end"&&(e.compactionStatus={active:!1,startedAt:e.compactionStatus?.startedAt??null,completedAt:Date.now()},e.compactionClearTimer=window.setTimeout(()=>{e.compactionStatus=null,e.compactionClearTimer=null},Eo))}function Fo(e,t){if(!t)return;if(t.stream==="compaction"){Mo(e,t);return}if(t.stream!=="tool")return;const n=typeof t.sessionKey=="string"?t.sessionKey:void 0;if(n&&n!==e.sessionKey||!n&&e.chatRunId&&t.runId!==e.chatRunId||e.chatRunId&&t.runId!==e.chatRunId||!e.chatRunId)return;const i=t.data??{},s=typeof i.toolCallId=="string"?i.toolCallId:"";if(!s)return;const a=typeof i.name=="string"?i.name:"tool",l=typeof i.phase=="string"?i.phase:"",r=l==="start"?i.args:void 0,d=l==="update"?mn(i.partialResult):l==="result"?mn(i.result):void 0,g=Date.now();let p=e.toolStreamById.get(s);p?(p.name=a,r!==void 0&&(p.args=r),d!==void 0&&(p.output=d),p.updatedAt=g):(p={toolCallId:s,runId:t.runId,sessionKey:n,name:a,args:r,output:d,startedAt:typeof t.ts=="number"?t.ts:g,updatedAt:g,message:{}},e.toolStreamById.set(s,p),e.toolStreamOrder.push(s)),p.message=Io(p),Lo(e),To(e,l==="result")}const Ro=/^\[([^\]]+)\]\s*/,Po=["WebChat","WhatsApp","Telegram","Signal","Slack","Discord","iMessage","Teams","Matrix","Zalo","Zalo Personal","BlueBubbles"],st=new WeakMap,at=new WeakMap;function No(e){return/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z\b/.test(e)||/\d{4}-\d{2}-\d{2} \d{2}:\d{2}\b/.test(e)?!0:Po.some(t=>e.startsWith(`${t} `))}function ot(e){const t=e.match(Ro);if(!t)return e;const n=t[1]??"";return No(n)?e.slice(t[0].length):e}function xt(e){const t=e,n=typeof t.role=="string"?t.role:"",i=t.content;if(typeof i=="string")return n==="assistant"?Ze(i):ot(i);if(Array.isArray(i)){const s=i.map(a=>{const l=a;return l.type==="text"&&typeof l.text=="string"?l.text:null}).filter(a=>typeof a=="string");if(s.length>0){const a=s.join(`
`);return n==="assistant"?Ze(a):ot(a)}}return typeof t.text=="string"?n==="assistant"?Ze(t.text):ot(t.text):null}function Hi(e){if(!e||typeof e!="object")return xt(e);const t=e;if(st.has(t))return st.get(t)??null;const n=xt(e);return st.set(t,n),n}function yn(e){const n=e.content,i=[];if(Array.isArray(n))for(const r of n){const d=r;if(d.type==="thinking"&&typeof d.thinking=="string"){const g=d.thinking.trim();g&&i.push(g)}}if(i.length>0)return i.join(`
`);const s=Do(e);if(!s)return null;const l=[...s.matchAll(/<\s*think(?:ing)?\s*>([\s\S]*?)<\s*\/\s*think(?:ing)?\s*>/gi)].map(r=>(r[1]??"").trim()).filter(Boolean);return l.length>0?l.join(`
`):null}function Bo(e){if(!e||typeof e!="object")return yn(e);const t=e;if(at.has(t))return at.get(t)??null;const n=yn(e);return at.set(t,n),n}function Do(e){const t=e,n=t.content;if(typeof n=="string")return n;if(Array.isArray(n)){const i=n.map(s=>{const a=s;return a.type==="text"&&typeof a.text=="string"?a.text:null}).filter(s=>typeof s=="string");if(i.length>0)return i.join(`
`)}return typeof t.text=="string"?t.text:null}function Oo(e){const t=e.trim();if(!t)return"";const n=t.split(/\r?\n/).map(i=>i.trim()).filter(Boolean).map(i=>`_${i}_`);return n.length?["_Reasoning:_",...n].join(`
`):""}let bn=!1;function wn(e){e[6]=e[6]&15|64,e[8]=e[8]&63|128;let t="";for(let n=0;n<e.length;n++)t+=e[n].toString(16).padStart(2,"0");return`${t.slice(0,8)}-${t.slice(8,12)}-${t.slice(12,16)}-${t.slice(16,20)}-${t.slice(20)}`}function Ko(){const e=new Uint8Array(16),t=Date.now();for(let n=0;n<e.length;n++)e[n]=Math.floor(Math.random()*256);return e[0]^=t&255,e[1]^=t>>>8&255,e[2]^=t>>>16&255,e[3]^=t>>>24&255,e}function Uo(){bn||(bn=!0,console.warn("[uuid] crypto API missing; falling back to weak randomness"))}function Jt(e=globalThis.crypto){if(e&&typeof e.randomUUID=="function")return e.randomUUID();if(e&&typeof e.getRandomValues=="function"){const t=new Uint8Array(16);return e.getRandomValues(t),wn(t)}return Uo(),wn(Ko())}async function we(e){if(!(!e.client||!e.connected)){e.chatLoading=!0,e.lastError=null;try{const t=await e.client.request("chat.history",{sessionKey:e.sessionKey,limit:200});e.chatMessages=Array.isArray(t.messages)?t.messages:[],e.chatThinkingLevel=t.thinkingLevel??null}catch(t){e.lastError=String(t)}finally{e.chatLoading=!1}}}function jo(e){const t=/^data:([^;]+);base64,(.+)$/.exec(e);return t?{mimeType:t[1],content:t[2]}:null}async function Ho(e,t,n){if(!e.client||!e.connected)return null;const i=t.trim(),s=n&&n.length>0;if(!i&&!s)return null;const a=Date.now(),l=[];if(i&&l.push({type:"text",text:i}),s)for(const g of n)l.push({type:"image",source:{type:"base64",media_type:g.mimeType,data:g.dataUrl}});e.chatMessages=[...e.chatMessages,{role:"user",content:l,timestamp:a}],e.chatSending=!0,e.lastError=null;const r=Jt();e.chatRunId=r,e.chatStream="",e.chatStreamStartedAt=a;const d=s?n.map(g=>{const p=jo(g.dataUrl);return p?{type:"image",mimeType:p.mimeType,content:p.content}:null}).filter(g=>g!==null):void 0;try{return await e.client.request("chat.send",{sessionKey:e.sessionKey,message:i,deliver:!1,idempotencyKey:r,attachments:d}),r}catch(g){const p=String(g);return e.chatRunId=null,e.chatStream=null,e.chatStreamStartedAt=null,e.lastError=p,e.chatMessages=[...e.chatMessages,{role:"assistant",content:[{type:"text",text:"Error: "+p}],timestamp:Date.now()}],null}finally{e.chatSending=!1}}async function zo(e){if(!e.client||!e.connected)return!1;const t=e.chatRunId;try{return await e.client.request("chat.abort",t?{sessionKey:e.sessionKey,runId:t}:{sessionKey:e.sessionKey}),!0}catch(n){return e.lastError=String(n),!1}}function Vo(e,t){if(!t||t.sessionKey!==e.sessionKey)return null;if(t.runId&&e.chatRunId&&t.runId!==e.chatRunId)return t.state==="final"?"final":null;if(t.state==="delta"){const n=xt(t.message);if(typeof n=="string"){const i=e.chatStream??"";(!i||n.length>=i.length)&&(e.chatStream=n)}}else t.state==="final"||t.state==="aborted"?(e.chatStream=null,e.chatRunId=null,e.chatStreamStartedAt=null):t.state==="error"&&(e.chatStream=null,e.chatRunId=null,e.chatStreamStartedAt=null,e.lastError=t.errorMessage??"chat error");return t.state}const zi=120;function Vi(e){return e.chatSending||!!e.chatRunId}function qo(e){const t=e.trim();if(!t)return!1;const n=t.toLowerCase();return n==="/stop"?!0:n==="stop"||n==="esc"||n==="abort"||n==="wait"||n==="exit"}function Go(e){const t=e.trim();if(!t)return!1;const n=t.toLowerCase();return n==="/new"||n==="/reset"?!0:n.startsWith("/new ")||n.startsWith("/reset ")}async function qi(e){e.connected&&(e.chatMessage="",await zo(e))}function Wo(e,t,n,i){const s=t.trim(),a=!!(n&&n.length>0);!s&&!a||(e.chatQueue=[...e.chatQueue,{id:Jt(),text:s,createdAt:Date.now(),attachments:a?n?.map(l=>({...l})):void 0,refreshSessions:i}])}async function Gi(e,t,n){Ge(e);const i=await Ho(e,t,n?.attachments),s=!!i;return!s&&n?.previousDraft!=null&&(e.chatMessage=n.previousDraft),!s&&n?.previousAttachments&&(e.chatAttachments=n.previousAttachments),s&&Oi(e,e.sessionKey),s&&n?.restoreDraft&&n.previousDraft?.trim()&&(e.chatMessage=n.previousDraft),s&&n?.restoreAttachments&&n.previousAttachments?.length&&(e.chatAttachments=n.previousAttachments),Se(e),s&&!e.chatRunId&&Wi(e),s&&n?.refreshSessions&&i&&e.refreshSessionsAfterChat.add(i),s}async function Wi(e){if(!e.connected||Vi(e))return;const[t,...n]=e.chatQueue;if(!t)return;e.chatQueue=n,await Gi(e,t.text,{attachments:t.attachments,refreshSessions:t.refreshSessions})||(e.chatQueue=[t,...e.chatQueue])}function Yo(e,t){e.chatQueue=e.chatQueue.filter(n=>n.id!==t)}async function Qo(e,t,n){if(!e.connected)return;const i=e.chatMessage,s=(t??e.chatMessage).trim(),a=e.chatAttachments??[],l=t==null?a:[],r=l.length>0;if(!s&&!r)return;if(qo(s)){await qi(e);return}const d=Go(s);if(t==null&&(e.chatMessage="",e.chatAttachments=[]),Vi(e)){Wo(e,s,l,d);return}await Gi(e,s,{previousDraft:t==null?i:void 0,restoreDraft:!!(t&&n?.restoreDraft),attachments:r?l:void 0,previousAttachments:t==null?a:void 0,restoreAttachments:!!(t&&n?.restoreDraft),refreshSessions:d})}async function Yi(e){await Promise.all([we(e),z(e,{activeMinutes:zi}),At(e)]),Se(e)}const Jo=Wi;function Xo(e){const t=di(e.sessionKey);return t?.agentId?t.agentId:e.hello?.snapshot?.sessionDefaults?.defaultAgentId?.trim()||"main"}function Zo(e,t){const n=Ve(e),i=encodeURIComponent(t);return n?`${n}/avatar/${i}?meta=1`:`/avatar/${i}?meta=1`}async function At(e){if(!e.connected){e.chatAvatarUrl=null;return}const t=Xo(e);if(!t){e.chatAvatarUrl=null;return}e.chatAvatarUrl=null;const n=Zo(e.basePath,t);try{const i=await fetch(n,{method:"GET"});if(!i.ok){e.chatAvatarUrl=null;return}const s=await i.json(),a=typeof s.avatarUrl=="string"?s.avatarUrl.trim():"";e.chatAvatarUrl=a||null}catch{e.chatAvatarUrl=null}}const el={trace:!0,debug:!0,info:!0,warn:!0,error:!0,fatal:!0},tl={name:"",description:"",agentId:"",enabled:!0,scheduleKind:"every",scheduleAt:"",everyAmount:"30",everyUnit:"minutes",cronExpr:"0 7 * * *",cronTz:"",sessionTarget:"main",wakeMode:"next-heartbeat",payloadKind:"systemEvent",payloadText:"",deliver:!1,channel:"last",to:"",timeoutSeconds:"",postToMainPrefix:""},nl=50,il=200,sl="Assistant";function $n(e,t){if(typeof e!="string")return;const n=e.trim();if(n)return n.length<=t?n:n.slice(0,t)}function Ct(e){const t=$n(e?.name,nl)??sl,n=$n(e?.avatar??void 0,il)??null;return{agentId:typeof e?.agentId=="string"&&e.agentId.trim()?e.agentId.trim():null,name:t,avatar:n}}function al(){return Ct(typeof window>"u"?{}:{name:window.__OPENCLAW_ASSISTANT_NAME__,avatar:window.__OPENCLAW_ASSISTANT_AVATAR__})}async function Qi(e,t){if(!e.client||!e.connected)return;const n=e.sessionKey.trim(),i=n?{sessionKey:n}:{};try{const s=await e.client.request("agent.identity.get",i);if(!s)return;const a=Ct(s);e.assistantName=a.name,e.assistantAvatar=a.avatar,e.assistantAgentId=a.agentId??null}catch{}}function It(e){return typeof e=="object"&&e!==null}function ol(e){if(!It(e))return null;const t=typeof e.id=="string"?e.id.trim():"",n=e.request;if(!t||!It(n))return null;const i=typeof n.command=="string"?n.command.trim():"";if(!i)return null;const s=typeof e.createdAtMs=="number"?e.createdAtMs:0,a=typeof e.expiresAtMs=="number"?e.expiresAtMs:0;return!s||!a?null:{id:t,request:{command:i,cwd:typeof n.cwd=="string"?n.cwd:null,host:typeof n.host=="string"?n.host:null,security:typeof n.security=="string"?n.security:null,ask:typeof n.ask=="string"?n.ask:null,agentId:typeof n.agentId=="string"?n.agentId:null,resolvedPath:typeof n.resolvedPath=="string"?n.resolvedPath:null,sessionKey:typeof n.sessionKey=="string"?n.sessionKey:null},createdAtMs:s,expiresAtMs:a}}function ll(e){if(!It(e))return null;const t=typeof e.id=="string"?e.id.trim():"";return t?{id:t,decision:typeof e.decision=="string"?e.decision:null,resolvedBy:typeof e.resolvedBy=="string"?e.resolvedBy:null,ts:typeof e.ts=="number"?e.ts:null}:null}function Ji(e){const t=Date.now();return e.filter(n=>n.expiresAtMs>t)}function rl(e,t){const n=Ji(e).filter(i=>i.id!==t.id);return n.push(t),n}function Sn(e,t){return Ji(e).filter(n=>n.id!==t)}function cl(e){const t=e.version??(e.nonce?"v2":"v1"),n=e.scopes.join(","),i=e.token??"",s=[t,e.deviceId,e.clientId,e.clientMode,e.role,n,String(e.signedAtMs),i];return t==="v2"&&s.push(e.nonce??""),s.join("|")}const Xi={WEBCHAT_UI:"webchat-ui",CONTROL_UI:"openclaw-control-ui",WEBCHAT:"webchat",CLI:"cli",GATEWAY_CLIENT:"gateway-client",MACOS_APP:"openclaw-macos",IOS_APP:"openclaw-ios",ANDROID_APP:"openclaw-android",NODE_HOST:"node-host",TEST:"test",FINGERPRINT:"fingerprint",PROBE:"openclaw-probe"},kn=Xi,Lt={WEBCHAT:"webchat",CLI:"cli",UI:"ui",BACKEND:"backend",NODE:"node",PROBE:"probe",TEST:"test"};new Set(Object.values(Xi));new Set(Object.values(Lt));const dl=4008;class ul{constructor(t){this.opts=t,this.ws=null,this.pending=new Map,this.closed=!1,this.lastSeq=null,this.connectNonce=null,this.connectSent=!1,this.connectTimer=null,this.backoffMs=800}start(){this.closed=!1,this.connect()}stop(){this.closed=!0,this.ws?.close(),this.ws=null,this.flushPending(new Error("gateway client stopped"))}get connected(){return this.ws?.readyState===WebSocket.OPEN}connect(){this.closed||(this.ws=new WebSocket(this.opts.url),this.ws.addEventListener("open",()=>this.queueConnect()),this.ws.addEventListener("message",t=>this.handleMessage(String(t.data??""))),this.ws.addEventListener("close",t=>{const n=String(t.reason??"");this.ws=null,this.flushPending(new Error(`gateway closed (${t.code}): ${n}`)),this.opts.onClose?.({code:t.code,reason:n}),this.scheduleReconnect()}),this.ws.addEventListener("error",()=>{}))}scheduleReconnect(){if(this.closed)return;const t=this.backoffMs;this.backoffMs=Math.min(this.backoffMs*1.7,15e3),window.setTimeout(()=>this.connect(),t)}flushPending(t){for(const[,n]of this.pending)n.reject(t);this.pending.clear()}async sendConnect(){if(this.connectSent)return;this.connectSent=!0,this.connectTimer!==null&&(window.clearTimeout(this.connectTimer),this.connectTimer=null);const t=typeof crypto<"u"&&!!crypto.subtle,n=["operator.admin","operator.approvals","operator.pairing"],i="operator";let s=null,a=!1,l=this.opts.token;if(t){s=await Vt();const p=ha({deviceId:s.deviceId,role:i})?.token;l=p??this.opts.token,a=!!(p&&this.opts.token)}const r=l||this.opts.password?{token:l,password:this.opts.password}:void 0;let d;if(t&&s){const p=Date.now(),v=this.connectNonce??void 0,c=cl({deviceId:s.deviceId,clientId:this.opts.clientName??kn.CONTROL_UI,clientMode:this.opts.mode??Lt.WEBCHAT,role:i,scopes:n,signedAtMs:p,token:l??null,nonce:v}),u=await Ua(s.privateKey,c);d={id:s.deviceId,publicKey:s.publicKey,signature:u,signedAt:p,nonce:v}}const g={minProtocol:3,maxProtocol:3,client:{id:this.opts.clientName??kn.CONTROL_UI,version:this.opts.clientVersion??"dev",platform:this.opts.platform??navigator.platform??"web",mode:this.opts.mode??Lt.WEBCHAT,instanceId:this.opts.instanceId},role:i,scopes:n,device:d,caps:[],auth:r,userAgent:navigator.userAgent,locale:navigator.language};this.request("connect",g).then(p=>{p?.auth?.deviceToken&&s&&bi({deviceId:s.deviceId,role:p.auth.role??i,token:p.auth.deviceToken,scopes:p.auth.scopes??[]}),this.backoffMs=800,this.opts.onHello?.(p)}).catch(()=>{a&&s&&wi({deviceId:s.deviceId,role:i}),this.ws?.close(dl,"connect failed")})}handleMessage(t){let n;try{n=JSON.parse(t)}catch{return}const i=n;if(i.type==="event"){const s=n;if(s.event==="connect.challenge"){const l=s.payload,r=l&&typeof l.nonce=="string"?l.nonce:null;r&&(this.connectNonce=r,this.sendConnect());return}const a=typeof s.seq=="number"?s.seq:null;a!==null&&(this.lastSeq!==null&&a>this.lastSeq+1&&this.opts.onGap?.({expected:this.lastSeq+1,received:a}),this.lastSeq=a);try{this.opts.onEvent?.(s)}catch(l){console.error("[gateway] event handler error:",l)}return}if(i.type==="res"){const s=n,a=this.pending.get(s.id);if(!a)return;this.pending.delete(s.id),s.ok?a.resolve(s.payload):a.reject(new Error(s.error?.message??"request failed"));return}}request(t,n){if(!this.ws||this.ws.readyState!==WebSocket.OPEN)return Promise.reject(new Error("gateway not connected"));const i=Jt(),s={type:"req",id:i,method:t,params:n},a=new Promise((l,r)=>{this.pending.set(i,{resolve:d=>l(d),reject:r})});return this.ws.send(JSON.stringify(s)),a}queueConnect(){this.connectNonce=null,this.connectSent=!1,this.connectTimer!==null&&window.clearTimeout(this.connectTimer),this.connectTimer=window.setTimeout(()=>{this.sendConnect()},750)}}function lt(e,t){const n=(e??"").trim(),i=t.mainSessionKey?.trim();if(!i)return n;if(!n)return i;const s=t.mainKey?.trim()||"main",a=t.defaultAgentId?.trim();return n==="main"||n===s||a&&(n===`agent:${a}:main`||n===`agent:${a}:${s}`)?i:n}function gl(e,t){if(!t?.mainSessionKey)return;const n=lt(e.sessionKey,t),i=lt(e.settings.sessionKey,t),s=lt(e.settings.lastActiveSessionKey,t),a=n||i||e.sessionKey,l={...e.settings,sessionKey:i||a,lastActiveSessionKey:s||a},r=l.sessionKey!==e.settings.sessionKey||l.lastActiveSessionKey!==e.settings.lastActiveSessionKey;a!==e.sessionKey&&(e.sessionKey=a),r&&Y(e,l)}function Zi(e){e.lastError=null,e.hello=null,e.connected=!1,e.connectionState="disconnected",e.execApprovalQueue=[],e.execApprovalError=null,e.client?.stop(),e.client=new ul({url:e.settings.gatewayUrl,token:e.settings.token.trim()?e.settings.token:void 0,password:e.password.trim()?e.password:void 0,clientName:"openclaw-control-ui",mode:"webchat",onHello:t=>{e.connected=!0,e.connectionState="connected",e.lastError=null,e.hello=t,pl(e,t),e.chatRunId=null,e.chatStream=null,e.chatStreamStartedAt=null,Ge(e),Qi(e),pe(e),Ue(e,{quiet:!0}),J(e,{quiet:!0}),Qt(e)},onClose:({code:t,reason:n})=>{e.connected=!1;const i=e;if(t!==1012){i.connectionState="reconnecting";const s=`disconnected (${t}): ${n||"no reason"}`;e.lastError=s}else i.connectionState="disconnected"},onEvent:t=>fl(e,t),onGap:({expected:t,received:n})=>{e.lastError=`event gap detected (expected seq ${t}, got ${n}); refresh recommended`}}),e.client.start()}function fl(e,t){try{vl(e,t)}catch(n){console.error("[gateway] handleGatewayEvent error:",t.event,n)}}function vl(e,t){if(e.eventLogBuffer=[{ts:Date.now(),event:t.event,payload:t.payload},...e.eventLogBuffer].slice(0,250),e.tab==="debug"&&(e.eventLog=e.eventLogBuffer),t.event==="agent"){if(e.onboarding)return;Fo(e,t.payload);return}if(t.event==="chat"){const n=t.payload;n?.sessionKey&&Oi(e,n.sessionKey);const i=Vo(e,n);if(i==="final"||i==="error"||i==="aborted"){Ge(e),Jo(e);const s=n?.runId;s&&e.refreshSessionsAfterChat.has(s)&&(e.refreshSessionsAfterChat.delete(s),i==="final"&&z(e,{activeMinutes:zi}))}i==="final"&&we(e);return}if(t.event==="presence"){const n=t.payload;n?.presence&&Array.isArray(n.presence)&&(e.presenceEntries=n.presence,e.presenceError=null,e.presenceStatus=null);return}if(t.event==="cron"&&e.tab==="cron"&&Be(e),(t.event==="device.pair.requested"||t.event==="device.pair.resolved")&&J(e,{quiet:!0}),t.event==="exec.approval.requested"){const n=ol(t.payload);if(n){e.execApprovalQueue=rl(e.execApprovalQueue,n),e.execApprovalError=null;const i=Math.max(0,n.expiresAtMs-Date.now()+500);window.setTimeout(()=>{e.execApprovalQueue=Sn(e.execApprovalQueue,n.id)},i)}return}if(t.event==="exec.approval.resolved"){const n=ll(t.payload);n&&(e.execApprovalQueue=Sn(e.execApprovalQueue,n.id))}}function pl(e,t){const n=t.snapshot;n?.presence&&Array.isArray(n.presence)&&(e.presenceEntries=n.presence),n?.health&&(e.debugHealth=n.health),n?.sessionDefaults&&gl(e,n.sessionDefaults)}function hl(e){e.basePath=ho(),fo(e),wo(e,!0),mo(e),yo(e),window.addEventListener("popstate",e.popStateHandler),Zi(e),sa(e),e.tab==="logs"&&Nt(e),e.tab==="debug"&&Dt(e)}function ml(e){Js(e)}function yl(e){window.removeEventListener("popstate",e.popStateHandler),aa(e),Bt(e),Ot(e),bo(e),e.topbarObserver?.disconnect(),e.topbarObserver=null}function bl(e,t){if(e.tab==="chat"&&(t.has("chatMessages")||t.has("chatToolMessages")||t.has("chatStream")||t.has("chatLoading")||t.has("tab"))){const n=t.has("tab"),i=t.has("chatLoading")&&t.get("chatLoading")===!0&&!e.chatLoading;Se(e,n||i||!e.chatHasAutoScrolled)}e.tab==="logs"&&(t.has("logsEntries")||t.has("logsAutoFollow")||t.has("tab"))&&e.logsAutoFollow&&e.logsAtBottom&&ui(e,t.has("tab")||t.has("logsAutoFollow"))}const de=(e,t)=>{const n=e._$AN;if(n===void 0)return!1;for(const i of n)i._$AO?.(t,!1),de(i,t);return!0},De=e=>{let t,n;do{if((t=e._$AM)===void 0)break;n=t._$AN,n.delete(e),e=t}while(n?.size===0)},es=e=>{for(let t;t=e._$AM;e=t){let n=t._$AN;if(n===void 0)t._$AN=n=new Set;else if(n.has(e))break;n.add(e),Sl(t)}};function wl(e){this._$AN!==void 0?(De(this),this._$AM=e,es(this)):this._$AM=e}function $l(e,t=!1,n=0){const i=this._$AH,s=this._$AN;if(s!==void 0&&s.size!==0)if(t)if(Array.isArray(i))for(let a=n;a<i.length;a++)de(i[a],!1),De(i[a]);else i!=null&&(de(i,!1),De(i));else de(this,e)}const Sl=e=>{e.type==ti.CHILD&&(e._$AP??=$l,e._$AQ??=wl)};class kl extends ei{constructor(){super(...arguments),this._$AN=void 0}_$AT(t,n,i){super._$AT(t,n,i),es(this),this.isConnected=t._$AU}_$AO(t,n=!0){t!==this.isConnected&&(this.isConnected=t,t?this.reconnected?.():this.disconnected?.()),n&&(de(this,t),De(this))}setValue(t){if(As(this._$Ct))this._$Ct._$AI(t,this);else{const n=[...this._$Ct._$AH];n[this._$Ci]=t,this._$Ct._$AI(n,this,0)}}disconnected(){}reconnected(){}}const rt=new WeakMap,Oe=ni(class extends kl{render(e){return f}update(e,[t]){const n=t!==this.G;return n&&this.G!==void 0&&this.rt(void 0),(n||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),f}rt(e){if(this.isConnected||(e=void 0),typeof this.G=="function"){const t=this.ht??globalThis;let n=rt.get(t);n===void 0&&(n=new WeakMap,rt.set(t,n)),n.get(this.G)!==void 0&&this.G.call(this.ht,void 0),n.set(this.G,e),e!==void 0&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){return typeof this.G=="function"?rt.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),M={messageSquare:o`
    <svg viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  `,barChart:o`
    <svg viewBox="0 0 24 24">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  `,link:o`
    <svg viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  `,radio:o`
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="2" />
      <path
        d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"
      />
    </svg>
  `,fileText:o`
    <svg viewBox="0 0 24 24">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  `,zap:o`
    <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
  `,monitor:o`
    <svg viewBox="0 0 24 24">
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  `,settings:o`
    <svg viewBox="0 0 24 24">
      <path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  `,bug:o`
    <svg viewBox="0 0 24 24">
      <path d="m8 2 1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" />
      <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
      <path d="M22 13h-4" />
      <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </svg>
  `,scrollText:o`
    <svg viewBox="0 0 24 24">
      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M15 8h-5" />
      <path d="M15 12h-5" />
    </svg>
  `,folder:o`
    <svg viewBox="0 0 24 24">
      <path
        d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      />
    </svg>
  `,menu:o`
    <svg viewBox="0 0 24 24">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  `,x:o`
    <svg viewBox="0 0 24 24">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  `,check:o`
    <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
  `,arrowDown:o`
    <svg viewBox="0 0 24 24">
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  `,copy:o`
    <svg viewBox="0 0 24 24">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  `,search:o`
    <svg viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  `,brain:o`
    <svg viewBox="0 0 24 24">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  `,book:o`
    <svg viewBox="0 0 24 24">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  `,loader:o`
    <svg viewBox="0 0 24 24">
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  `,wrench:o`
    <svg viewBox="0 0 24 24">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      />
    </svg>
  `,fileCode:o`
    <svg viewBox="0 0 24 24">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 17 2-2-2-2" />
    </svg>
  `,edit:o`
    <svg viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  `,penLine:o`
    <svg viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  `,paperclip:o`
    <svg viewBox="0 0 24 24">
      <path
        d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"
      />
    </svg>
  `,globe:o`
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  `,image:o`
    <svg viewBox="0 0 24 24">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  `,smartphone:o`
    <svg viewBox="0 0 24 24">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  `,plug:o`
    <svg viewBox="0 0 24 24">
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </svg>
  `,circle:o`
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
  `,puzzle:o`
    <svg viewBox="0 0 24 24">
      <path
        d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.076.874.54 1.02 1.02a2.5 2.5 0 1 0 3.237-3.237c-.48-.146-.944-.505-1.02-1.02a.98.98 0 0 1 .303-.917l1.526-1.526A2.402 2.402 0 0 1 11.998 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.236 3.236c-.464.18-.894.527-.967 1.02Z"
      />
    </svg>
  `};function xl(e,t){const n=Wt(t,e.basePath),i=e.tab===t;return o`
    <a
      href=${n}
      class="nav-item ${i?"active":""}"
      aria-current=${i?"page":f}
      @click=${s=>{s.defaultPrevented||s.button!==0||s.metaKey||s.ctrlKey||s.shiftKey||s.altKey||(s.preventDefault(),e.setTab(t))}}
      title=${be(t)}
    >
      <span class="nav-item__icon" aria-hidden="true">${M[ao(t)]}</span>
      <span class="nav-item__text">${be(t)}</span>
    </a>
  `}function Al(e){const t=Cl(e.hello,e.sessionsResult),n=Il(e.sessionKey,e.sessionsResult,t),i=e.onboarding,s=e.onboarding,a=e.onboarding?!1:e.settings.chatShowThinking,l=e.onboarding?!0:e.settings.chatFocusMode,r=o`
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
      <path d="M21 3v5h-5"></path>
    </svg>
  `,d=o`
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M4 7V4h3"></path>
      <path d="M20 7V4h-3"></path>
      <path d="M4 17v3h3"></path>
      <path d="M20 17v3h-3"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;return o`
    <div class="chat-controls">
      <label class="field chat-controls__session">
        <select
          .value=${e.sessionKey}
          ?disabled=${!e.connected}
          @change=${g=>{const p=g.target.value;e.sessionKey=p,e.chatMessage="",e.chatStream=null,e.chatStreamStartedAt=null,e.chatRunId=null,e.resetToolStream(),e.resetChatScroll(),e.applySettings({...e.settings,sessionKey:p,lastActiveSessionKey:p}),e.loadAssistantIdentity(),So(e,p),we(e)}}
        >
          ${ii(n,g=>g.key,g=>o`<option value=${g.key}>
                ${g.displayName??g.key}
              </option>`)}
        </select>
      </label>
      <button
        class="btn btn--sm btn--icon"
        ?disabled=${e.chatLoading||!e.connected}
        @click=${()=>{e.resetToolStream(),Yi(e)}}
        title="Refresh chat data"
      >
        ${r}
      </button>
      <span class="chat-controls__separator">|</span>
      <button
        class="btn btn--sm btn--icon ${a?"active":""}"
        ?disabled=${i}
        @click=${()=>{i||e.applySettings({...e.settings,chatShowThinking:!e.settings.chatShowThinking})}}
        aria-pressed=${a}
        title=${i?"Disabled during onboarding":"Toggle assistant thinking/working output"}
      >
        ${M.brain}
      </button>
      <button
        class="btn btn--sm btn--icon ${l?"active":""}"
        ?disabled=${s}
        @click=${()=>{s||e.applySettings({...e.settings,chatFocusMode:!e.settings.chatFocusMode})}}
        aria-pressed=${l}
        title=${s?"Disabled during onboarding":"Toggle focus mode (hide sidebar + page header)"}
      >
        ${d}
      </button>
    </div>
  `}function Cl(e,t){const n=e?.snapshot,i=n?.sessionDefaults?.mainSessionKey?.trim();if(i)return i;const s=n?.sessionDefaults?.mainKey?.trim();return s||(t?.sessions?.some(a=>a.key==="main")?"main":null)}function ct(e,t){const n=t?.label?.trim();if(n)return`${n} (${e})`;const i=t?.displayName?.trim();return i||e}function Il(e,t,n){const i=new Set,s=[],a=n&&t?.sessions?.find(r=>r.key===n),l=t?.sessions?.find(r=>r.key===e);if(n&&(i.add(n),s.push({key:n,displayName:ct(n,a)})),i.has(e)||(i.add(e),s.push({key:e,displayName:ct(e,l)})),t?.sessions)for(const r of t.sessions)i.has(r.key)||(i.add(r.key),s.push({key:r.key,displayName:ct(r.key,r)}));return s}const Ll=["system","light","dark"];function _l(e){const t=Math.max(0,Ll.indexOf(e.theme)),n=i=>s=>{const l={element:s.currentTarget};(s.clientX||s.clientY)&&(l.pointerClientX=s.clientX,l.pointerClientY=s.clientY),e.setTheme(i,l)};return o`
    <div class="theme-toggle" style="--theme-index: ${t};">
      <div class="theme-toggle__track" role="group" aria-label="Theme">
        <span class="theme-toggle__indicator"></span>
        <button
          class="theme-toggle__button ${e.theme==="system"?"active":""}"
          @click=${n("system")}
          aria-pressed=${e.theme==="system"}
          aria-label="System theme"
          title="System"
        >
          ${Ml()}
        </button>
        <button
          class="theme-toggle__button ${e.theme==="light"?"active":""}"
          @click=${n("light")}
          aria-pressed=${e.theme==="light"}
          aria-label="Light theme"
          title="Light"
        >
          ${Tl()}
        </button>
        <button
          class="theme-toggle__button ${e.theme==="dark"?"active":""}"
          @click=${n("dark")}
          aria-pressed=${e.theme==="dark"}
          aria-label="Dark theme"
          title="Dark"
        >
          ${El()}
        </button>
      </div>
    </div>
  `}function Tl(){return o`
    <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2"></path>
      <path d="M12 20v2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="m17.66 17.66 1.41 1.41"></path>
      <path d="M2 12h2"></path>
      <path d="M20 12h2"></path>
      <path d="m6.34 17.66-1.41 1.41"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
    </svg>
  `}function El(){return o`
    <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
      ></path>
    </svg>
  `}function Ml(){return o`
    <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="20" height="14" x="2" y="3" rx="2"></rect>
      <line x1="8" x2="16" y1="21" y2="21"></line>
      <line x1="12" x2="12" y1="17" y2="21"></line>
    </svg>
  `}function ts(e,t){if(!e)return e;const i=e.files.some(s=>s.name===t.name)?e.files.map(s=>s.name===t.name?t:s):[...e.files,t];return{...e,files:i}}async function dt(e,t){if(!(!e.client||!e.connected||e.agentFilesLoading)){e.agentFilesLoading=!0,e.agentFilesError=null;try{const n=await e.client.request("agents.files.list",{agentId:t});n&&(e.agentFilesList=n,e.agentFileActive&&!n.files.some(i=>i.name===e.agentFileActive)&&(e.agentFileActive=null))}catch(n){e.agentFilesError=String(n)}finally{e.agentFilesLoading=!1}}}async function Fl(e,t,n){if(!(!e.client||!e.connected||e.agentFilesLoading)&&!Object.hasOwn(e.agentFileContents,n)){e.agentFilesLoading=!0,e.agentFilesError=null;try{const i=await e.client.request("agents.files.get",{agentId:t,name:n});if(i?.file){const s=i.file.content??"";e.agentFilesList=ts(e.agentFilesList,i.file),e.agentFileContents={...e.agentFileContents,[n]:s},Object.hasOwn(e.agentFileDrafts,n)||(e.agentFileDrafts={...e.agentFileDrafts,[n]:s})}}catch(i){e.agentFilesError=String(i)}finally{e.agentFilesLoading=!1}}}async function Rl(e,t,n,i){if(!(!e.client||!e.connected||e.agentFileSaving)){e.agentFileSaving=!0,e.agentFilesError=null;try{const s=await e.client.request("agents.files.set",{agentId:t,name:n,content:i});s?.file&&(e.agentFilesList=ts(e.agentFilesList,s.file),e.agentFileContents={...e.agentFileContents,[n]:i},e.agentFileDrafts={...e.agentFileDrafts,[n]:i})}catch(s){e.agentFilesError=String(s)}finally{e.agentFileSaving=!1}}}const Pl={bash:"exec","apply-patch":"apply_patch"},Nl={"group:memory":["memory_search","memory_get"],"group:web":["web_search","web_fetch"],"group:fs":["read","write","edit","apply_patch"],"group:runtime":["exec","process"],"group:sessions":["sessions_list","sessions_history","sessions_send","sessions_spawn","session_status"],"group:ui":["browser","canvas"],"group:automation":["cron","gateway"],"group:messaging":["message"],"group:nodes":["nodes"],"group:openclaw":["browser","canvas","nodes","cron","message","gateway","agents_list","sessions_list","sessions_history","sessions_send","sessions_spawn","session_status","memory_search","memory_get","web_search","web_fetch","image"]},Bl={minimal:{allow:["session_status"]},coding:{allow:["group:fs","group:runtime","group:sessions","group:memory","image"]},messaging:{allow:["group:messaging","sessions_list","sessions_history","sessions_send","session_status"]},full:{}};function K(e){const t=e.trim().toLowerCase();return Pl[t]??t}function Dl(e){return e?e.map(K).filter(Boolean):[]}function Ol(e){const t=Dl(e),n=[];for(const i of t){const s=Nl[i];if(s){n.push(...s);continue}n.push(i)}return Array.from(new Set(n))}function Kl(e){if(!e)return;const t=Bl[e];if(t&&!(!t.allow&&!t.deny))return{allow:t.allow?[...t.allow]:void 0,deny:t.deny?[...t.deny]:void 0}}function Ul(e){const t=e.host??"unknown",n=e.ip?`(${e.ip})`:"",i=e.mode??"",s=e.version??"";return`${t} ${n} ${i} ${s}`.trim()}function jl(e){const t=e.ts??null;return t?T(t):"n/a"}function Xt(e){return e?`${he(e)} (${T(e)})`:"n/a"}function Hl(e){if(e.totalTokens==null)return"n/a";const t=e.totalTokens??0,n=e.contextTokens??0;return n?`${t} / ${n}`:String(t)}function zl(e){if(e==null)return"";try{return JSON.stringify(e,null,2)}catch{return String(e)}}function ns(e){const t=e.state??{},n=t.nextRunAtMs?he(t.nextRunAtMs):"n/a",i=t.lastRunAtMs?he(t.lastRunAtMs):"n/a";return`${t.lastStatus??"n/a"} · next ${n} · last ${i}`}function is(e){const t=e.schedule;return t.kind==="at"?`At ${he(t.atMs)}`:t.kind==="every"?`Every ${vi(t.everyMs)}`:`Cron ${t.expr}${t.tz?` (${t.tz})`:""}`}function ss(e){const t=e.payload;return t.kind==="systemEvent"?`System: ${t.text}`:`Agent: ${t.message}`}const xn=[{id:"fs",label:"Files",tools:[{id:"read",label:"read",description:"Read file contents"},{id:"write",label:"write",description:"Create or overwrite files"},{id:"edit",label:"edit",description:"Make precise edits"},{id:"apply_patch",label:"apply_patch",description:"Patch files (OpenAI)"}]},{id:"runtime",label:"Runtime",tools:[{id:"exec",label:"exec",description:"Run shell commands"},{id:"process",label:"process",description:"Manage background processes"}]},{id:"web",label:"Web",tools:[{id:"web_search",label:"web_search",description:"Search the web"},{id:"web_fetch",label:"web_fetch",description:"Fetch web content"}]},{id:"memory",label:"Memory",tools:[{id:"memory_search",label:"memory_search",description:"Semantic search"},{id:"memory_get",label:"memory_get",description:"Read memory files"}]},{id:"sessions",label:"Sessions",tools:[{id:"sessions_list",label:"sessions_list",description:"List sessions"},{id:"sessions_history",label:"sessions_history",description:"Session history"},{id:"sessions_send",label:"sessions_send",description:"Send to session"},{id:"sessions_spawn",label:"sessions_spawn",description:"Spawn sub-agent"},{id:"session_status",label:"session_status",description:"Session status"}]},{id:"ui",label:"UI",tools:[{id:"browser",label:"browser",description:"Control web browser"},{id:"canvas",label:"canvas",description:"Control canvases"}]},{id:"messaging",label:"Messaging",tools:[{id:"message",label:"message",description:"Send messages"}]},{id:"automation",label:"Automation",tools:[{id:"cron",label:"cron",description:"Schedule tasks"},{id:"gateway",label:"gateway",description:"Gateway control"}]},{id:"nodes",label:"Nodes",tools:[{id:"nodes",label:"nodes",description:"Nodes + devices"}]},{id:"agents",label:"Agents",tools:[{id:"agents_list",label:"agents_list",description:"List agents"}]},{id:"media",label:"Media",tools:[{id:"image",label:"image",description:"Image understanding"}]}],Vl=[{id:"minimal",label:"Minimal"},{id:"coding",label:"Coding"},{id:"messaging",label:"Messaging"},{id:"full",label:"Full"}];function _t(e){return e.name?.trim()||e.identity?.name?.trim()||e.id}function Le(e){const t=e.trim();if(!t||t.length>16)return!1;let n=!1;for(let i=0;i<t.length;i+=1)if(t.charCodeAt(i)>127){n=!0;break}return!(!n||t.includes("://")||t.includes("/")||t.includes("."))}function We(e,t){const n=t?.emoji?.trim();if(n&&Le(n))return n;const i=e.identity?.emoji?.trim();if(i&&Le(i))return i;const s=t?.avatar?.trim();if(s&&Le(s))return s;const a=e.identity?.avatar?.trim();return a&&Le(a)?a:""}function as(e,t){return t&&e===t?"default":null}function ql(e){if(e==null||!Number.isFinite(e))return"-";if(e<1024)return`${e} B`;const t=["KB","MB","GB","TB"];let n=e/1024,i=0;for(;n>=1024&&i<t.length-1;)n/=1024,i+=1;return`${n.toFixed(n<10?1:0)} ${t[i]}`}function Ye(e,t){const n=e;return{entry:(n?.agents?.list??[]).find(a=>a?.id===t),defaults:n?.agents?.defaults,globalTools:n?.tools}}function os(e,t,n,i,s){const a=Ye(t,e.id),r=(n&&n.agentId===e.id?n.workspace:null)||a.entry?.workspace||a.defaults?.workspace||"default",d=a.entry?.model?ue(a.entry?.model):ue(a.defaults?.model),g=s?.name?.trim()||e.identity?.name?.trim()||e.name?.trim()||a.entry?.name||e.id,p=We(e,s)||"-",v=Array.isArray(a.entry?.skills)?a.entry?.skills:null,c=v?.length??null;return{workspace:r,model:d,identityName:g,identityEmoji:p,skillsLabel:v?`${c} selected`:"all skills",isDefault:!!(i&&e.id===i)}}function ue(e){if(!e)return"-";if(typeof e=="string")return e.trim()||"-";if(typeof e=="object"&&e){const t=e,n=t.primary?.trim();if(n){const i=Array.isArray(t.fallbacks)?t.fallbacks.length:0;return i>0?`${n} (+${i} fallback)`:n}}return"-"}function An(e){const t=e.match(/^(.+) \(\+\d+ fallback\)$/);return t?t[1]:e}function Cn(e){if(!e)return null;if(typeof e=="string")return e.trim()||null;if(typeof e=="object"&&e){const t=e;return(typeof t.primary=="string"?t.primary:typeof t.model=="string"?t.model:typeof t.id=="string"?t.id:typeof t.value=="string"?t.value:null)?.trim()||null}return null}function Gl(e){if(!e||typeof e=="string")return null;if(typeof e=="object"&&e){const t=e,n=Array.isArray(t.fallbacks)?t.fallbacks:Array.isArray(t.fallback)?t.fallback:null;return n?n.filter(i=>typeof i=="string"):null}return null}function Wl(e){return e.split(",").map(t=>t.trim()).filter(Boolean)}function Yl(e){const n=e?.agents?.defaults?.models;if(!n||typeof n!="object")return[];const i=[];for(const[s,a]of Object.entries(n)){const l=s.trim();if(!l)continue;const r=a&&typeof a=="object"&&"alias"in a&&typeof a.alias=="string"?a.alias?.trim():void 0,d=r&&r!==l?`${r} (${l})`:l;i.push({value:l,label:d})}return i}function Ql(e,t){const n=Yl(e),i=t?n.some(s=>s.value===t):!1;return t&&!i&&n.unshift({value:t,label:`Current (${t})`}),n.length===0?o`
      <option value="" disabled>No configured models</option>
    `:n.map(s=>o`<option value=${s.value}>${s.label}</option>`)}function Jl(e){const t=K(e);if(!t)return{kind:"exact",value:""};if(t==="*")return{kind:"all"};if(!t.includes("*"))return{kind:"exact",value:t};const n=t.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&");return{kind:"regex",value:new RegExp(`^${n.replaceAll("\\*",".*")}$`)}}function Tt(e){return Array.isArray(e)?Ol(e).map(Jl).filter(t=>t.kind!=="exact"||t.value.length>0):[]}function ge(e,t){for(const n of t)if(n.kind==="all"||n.kind==="exact"&&e===n.value||n.kind==="regex"&&n.value.test(e))return!0;return!1}function Xl(e,t){if(!t)return!0;const n=K(e),i=Tt(t.deny);if(ge(n,i))return!1;const s=Tt(t.allow);return!!(s.length===0||ge(n,s)||n==="apply_patch"&&ge("exec",s))}function In(e,t){if(!Array.isArray(t)||t.length===0)return!1;const n=K(e),i=Tt(t);return!!(ge(n,i)||n==="apply_patch"&&ge("exec",i))}function Zl(e){const t=e.agentsList?.agents??[],n=e.agentsList?.defaultId??null,i=e.selectedAgentId??n??t[0]?.id??null,s=i?t.find(a=>a.id===i)??null:null;return o`
    <div class="agents-layout">
      <section class="card agents-sidebar">
        <div class="row" style="justify-content: space-between;">
          <div>
            <div class="card-title">Agents</div>
            <div class="card-sub">${t.length} configured.</div>
          </div>
          <button class="btn btn--sm" ?disabled=${e.loading} @click=${e.onRefresh}>
            ${e.loading?"Loading…":"Refresh"}
          </button>
        </div>
        ${e.error?o`<div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:f}
        <div class="agent-list" style="margin-top: 12px;">
          ${t.length===0?o`
                  <div class="muted">No agents found.</div>
                `:t.map(a=>{const l=as(a.id,n),r=We(a,e.agentIdentityById[a.id]??null);return o`
                    <button
                      type="button"
                      class="agent-row ${i===a.id?"active":""}"
                      @click=${()=>e.onSelectAgent(a.id)}
                    >
                      <div class="agent-avatar">
                        ${r||_t(a).slice(0,1)}
                      </div>
                      <div class="agent-info">
                        <div class="agent-title">${_t(a)}</div>
                        <div class="agent-sub mono">${a.id}</div>
                      </div>
                      ${l?o`<span class="agent-pill">${l}</span>`:f}
                    </button>
                  `})}
        </div>
      </section>
      <section class="agents-main">
        ${s?o`
              ${er(s,n,e.agentIdentityById[s.id]??null)}
              ${tr(e.activePanel,a=>e.onSelectPanel(a))}
              ${e.activePanel==="overview"?nr({agent:s,defaultId:n,configForm:e.configForm,agentFilesList:e.agentFilesList,agentIdentity:e.agentIdentityById[s.id]??null,agentIdentityError:e.agentIdentityError,agentIdentityLoading:e.agentIdentityLoading,configLoading:e.configLoading,configSaving:e.configSaving,configDirty:e.configDirty,onConfigReload:e.onConfigReload,onConfigSave:e.onConfigSave,onModelChange:e.onModelChange,onModelFallbacksChange:e.onModelFallbacksChange}):f}
              ${e.activePanel==="files"?gr({agentId:s.id,agentFilesList:e.agentFilesList,agentFilesLoading:e.agentFilesLoading,agentFilesError:e.agentFilesError,agentFileActive:e.agentFileActive,agentFileContents:e.agentFileContents,agentFileDrafts:e.agentFileDrafts,agentFileSaving:e.agentFileSaving,onLoadFiles:e.onLoadFiles,onSelectFile:e.onSelectFile,onFileDraftChange:e.onFileDraftChange,onFileReset:e.onFileReset,onFileSave:e.onFileSave}):f}
              ${e.activePanel==="tools"?vr({agentId:s.id,configForm:e.configForm,configLoading:e.configLoading,configSaving:e.configSaving,configDirty:e.configDirty,onProfileChange:e.onToolsProfileChange,onOverridesChange:e.onToolsOverridesChange,onConfigReload:e.onConfigReload,onConfigSave:e.onConfigSave}):f}
              ${e.activePanel==="skills"?hr({agentId:s.id,report:e.agentSkillsReport,loading:e.agentSkillsLoading,error:e.agentSkillsError,activeAgentId:e.agentSkillsAgentId,configForm:e.configForm,configLoading:e.configLoading,configSaving:e.configSaving,configDirty:e.configDirty,filter:e.skillsFilter,onFilterChange:e.onSkillsFilterChange,onRefresh:e.onSkillsRefresh,onToggle:e.onAgentSkillToggle,onClear:e.onAgentSkillsClear,onDisableAll:e.onAgentSkillsDisableAll,onConfigReload:e.onConfigReload,onConfigSave:e.onConfigSave}):f}
              ${e.activePanel==="channels"?dr({agent:s,defaultId:n,configForm:e.configForm,agentFilesList:e.agentFilesList,agentIdentity:e.agentIdentityById[s.id]??null,snapshot:e.channelsSnapshot,loading:e.channelsLoading,error:e.channelsError,lastSuccess:e.channelsLastSuccess,onRefresh:e.onChannelsRefresh}):f}
              ${e.activePanel==="cron"?ur({agent:s,defaultId:n,configForm:e.configForm,agentFilesList:e.agentFilesList,agentIdentity:e.agentIdentityById[s.id]??null,jobs:e.cronJobs,status:e.cronStatus,loading:e.cronLoading,error:e.cronError,onRefresh:e.onCronRefresh}):f}
            `:o`
                <div class="card">
                  <div class="card-title">Select an agent</div>
                  <div class="card-sub">Pick an agent to inspect its workspace and tools.</div>
                </div>
              `}
      </section>
    </div>
  `}function er(e,t,n){const i=as(e.id,t),s=_t(e),a=e.identity?.theme?.trim()||"Agent workspace and routing.",l=We(e,n);return o`
    <section class="card agent-header">
      <div class="agent-header-main">
        <div class="agent-avatar agent-avatar--lg">
          ${l||s.slice(0,1)}
        </div>
        <div>
          <div class="card-title">${s}</div>
          <div class="card-sub">${a}</div>
        </div>
      </div>
      <div class="agent-header-meta">
        <div class="mono">${e.id}</div>
        ${i?o`<span class="agent-pill">${i}</span>`:f}
      </div>
    </section>
  `}function tr(e,t){return o`
    <div class="agent-tabs">
      ${[{id:"overview",label:"Overview"},{id:"files",label:"Files"},{id:"tools",label:"Tools"},{id:"skills",label:"Skills"},{id:"channels",label:"Channels"},{id:"cron",label:"Cron Jobs"}].map(i=>o`
          <button
            class="agent-tab ${e===i.id?"active":""}"
            type="button"
            @click=${()=>t(i.id)}
          >
            ${i.label}
          </button>
        `)}
    </div>
  `}function nr(e){const{agent:t,configForm:n,agentFilesList:i,agentIdentity:s,agentIdentityLoading:a,agentIdentityError:l,configLoading:r,configSaving:d,configDirty:g,onConfigReload:p,onConfigSave:v,onModelChange:c,onModelFallbacksChange:u}=e,b=Ye(n,t.id),$=(i&&i.agentId===t.id?i.workspace:null)||b.entry?.workspace||b.defaults?.workspace||"default",S=b.entry?.model?ue(b.entry?.model):ue(b.defaults?.model),k=ue(b.defaults?.model),C=Cn(b.entry?.model)||(S!=="-"?An(S):null),L=Cn(b.defaults?.model)||(k!=="-"?An(k):null),I=C??L??null,x=Gl(b.entry?.model),_=x?x.join(", "):"",xe=s?.name?.trim()||t.identity?.name?.trim()||t.name?.trim()||b.entry?.name||"-",ws=We(t,s)||"-",sn=Array.isArray(b.entry?.skills)?b.entry?.skills:null,$s=sn?.length??null,an=a?"Loading…":l?"Unavailable":"",Ss=!!(e.defaultId&&t.id===e.defaultId);return o`
    <section class="card">
      <div class="card-title">Overview</div>
      <div class="card-sub">Workspace paths and identity metadata.</div>
      <div class="agents-overview-grid" style="margin-top: 16px;">
        <div class="agent-kv">
          <div class="label">Workspace</div>
          <div class="mono">${$}</div>
        </div>
        <div class="agent-kv">
          <div class="label">Primary Model</div>
          <div class="mono">${S}</div>
        </div>
        <div class="agent-kv">
          <div class="label">Identity Name</div>
          <div>${xe}</div>
          ${an?o`<div class="agent-kv-sub muted">${an}</div>`:f}
        </div>
        <div class="agent-kv">
          <div class="label">Default</div>
          <div>${Ss?"yes":"no"}</div>
        </div>
        <div class="agent-kv">
          <div class="label">Identity Emoji</div>
          <div>${ws}</div>
        </div>
        <div class="agent-kv">
          <div class="label">Skills Filter</div>
          <div>${sn?`${$s} selected`:"all skills"}</div>
        </div>
      </div>

      <div class="agent-model-select" style="margin-top: 20px;">
        <div class="label">Model Selection</div>
        <div class="row" style="gap: 12px; flex-wrap: wrap;">
          <label class="field" style="min-width: 260px; flex: 1;">
            <span>Primary model</span>
            <select
              .value=${I??""}
              ?disabled=${!n||r||d}
              @change=${Xe=>c(t.id,Xe.target.value||null)}
            >
              <option value="">
                ${L?`Inherit default (${L})`:"Inherit default"}
              </option>
              ${Ql(n,I??void 0)}
            </select>
          </label>
          <label class="field" style="min-width: 260px; flex: 1;">
            <span>Fallbacks (comma-separated)</span>
            <input
              .value=${_}
              ?disabled=${!n||r||d}
              placeholder="provider/model, provider/model"
              @input=${Xe=>u(t.id,Wl(Xe.target.value))}
            />
          </label>
        </div>
        <div class="row" style="justify-content: flex-end; gap: 8px;">
          <button
            class="btn btn--sm"
            ?disabled=${r}
            @click=${p}
          >
            Reload Config
          </button>
          <button
            class="btn btn--sm primary"
            ?disabled=${d||!g}
            @click=${v}
          >
            ${d?"Saving…":"Save"}
          </button>
        </div>
      </div>
    </section>
  `}function ls(e,t){return o`
    <section class="card">
      <div class="card-title">Agent Context</div>
      <div class="card-sub">${t}</div>
      <div class="agents-overview-grid" style="margin-top: 16px;">
        <div class="agent-kv">
          <div class="label">Workspace</div>
          <div class="mono">${e.workspace}</div>
        </div>
        <div class="agent-kv">
          <div class="label">Primary Model</div>
          <div class="mono">${e.model}</div>
        </div>
        <div class="agent-kv">
          <div class="label">Identity Name</div>
          <div>${e.identityName}</div>
        </div>
        <div class="agent-kv">
          <div class="label">Identity Emoji</div>
          <div>${e.identityEmoji}</div>
        </div>
        <div class="agent-kv">
          <div class="label">Skills Filter</div>
          <div>${e.skillsLabel}</div>
        </div>
        <div class="agent-kv">
          <div class="label">Default</div>
          <div>${e.isDefault?"yes":"no"}</div>
        </div>
      </div>
    </section>
  `}function ir(e,t){const n=e.channelMeta?.find(i=>i.id===t);return n?.label?n.label:e.channelLabels?.[t]??t}function sr(e){if(!e)return[];const t=new Set;for(const s of e.channelOrder??[])t.add(s);for(const s of e.channelMeta??[])t.add(s.id);for(const s of Object.keys(e.channelAccounts??{}))t.add(s);const n=[],i=e.channelOrder?.length?e.channelOrder:Array.from(t);for(const s of i)t.has(s)&&(n.push(s),t.delete(s));for(const s of t)n.push(s);return n.map(s=>({id:s,label:ir(e,s),accounts:e.channelAccounts?.[s]??[]}))}const ar=["groupPolicy","streamMode","dmPolicy"];function or(e,t){if(!e)return null;const i=(e.channels??{})[t];if(i&&typeof i=="object")return i;const s=e[t];return s&&typeof s=="object"?s:null}function lr(e){if(e==null)return"n/a";if(typeof e=="string"||typeof e=="number"||typeof e=="boolean")return String(e);try{return JSON.stringify(e)}catch{return"n/a"}}function rr(e,t){const n=or(e,t);return n?ar.flatMap(i=>i in n?[{label:i,value:lr(n[i])}]:[]):[]}function cr(e){let t=0,n=0,i=0;for(const s of e){const a=s.probe&&typeof s.probe=="object"&&"ok"in s.probe?!!s.probe.ok:!1;(s.connected===!0||s.running===!0||a)&&(t+=1),s.configured&&(n+=1),s.enabled&&(i+=1)}return{total:e.length,connected:t,configured:n,enabled:i}}function dr(e){const t=os(e.agent,e.configForm,e.agentFilesList,e.defaultId,e.agentIdentity),n=sr(e.snapshot),i=e.lastSuccess?T(e.lastSuccess):"never";return o`
    <section class="grid grid-cols-2">
      ${ls(t,"Workspace, identity, and model configuration.")}
      <section class="card">
        <div class="row" style="justify-content: space-between;">
          <div>
            <div class="card-title">Channels</div>
            <div class="card-sub">Gateway-wide channel status snapshot.</div>
          </div>
          <button class="btn btn--sm" ?disabled=${e.loading} @click=${e.onRefresh}>
            ${e.loading?"Refreshing…":"Refresh"}
          </button>
        </div>
        <div class="muted" style="margin-top: 8px;">
          Last refresh: ${i}
        </div>
        ${e.error?o`<div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:f}
        ${e.snapshot?f:o`
                <div class="callout info" style="margin-top: 12px">Load channels to see live status.</div>
              `}
        ${n.length===0?o`
                <div class="muted" style="margin-top: 16px">No channels found.</div>
              `:o`
              <div class="list" style="margin-top: 16px;">
                ${n.map(s=>{const a=cr(s.accounts),l=a.total?`${a.connected}/${a.total} connected`:"no accounts",r=a.configured?`${a.configured} configured`:"not configured",d=a.total?`${a.enabled} enabled`:"disabled",g=rr(e.configForm,s.id);return o`
                    <div class="list-item">
                      <div class="list-main">
                        <div class="list-title">${s.label}</div>
                        <div class="list-sub mono">${s.id}</div>
                      </div>
                      <div class="list-meta">
                        <div>${l}</div>
                        <div>${r}</div>
                        <div>${d}</div>
                        ${g.length>0?g.map(p=>o`<div>${p.label}: ${p.value}</div>`):f}
                      </div>
                    </div>
                  `})}
              </div>
            `}
      </section>
    </section>
  `}function ur(e){const t=os(e.agent,e.configForm,e.agentFilesList,e.defaultId,e.agentIdentity),n=e.jobs.filter(i=>i.agentId===e.agent.id);return o`
    <section class="grid grid-cols-2">
      ${ls(t,"Workspace and scheduling targets.")}
      <section class="card">
        <div class="row" style="justify-content: space-between;">
          <div>
            <div class="card-title">Scheduler</div>
            <div class="card-sub">Gateway cron status.</div>
          </div>
          <button class="btn btn--sm" ?disabled=${e.loading} @click=${e.onRefresh}>
            ${e.loading?"Refreshing…":"Refresh"}
          </button>
        </div>
        <div class="stat-grid" style="margin-top: 16px;">
          <div class="stat">
            <div class="stat-label">Enabled</div>
            <div class="stat-value">
              ${e.status?e.status.enabled?"Yes":"No":"n/a"}
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">Jobs</div>
            <div class="stat-value">${e.status?.jobs??"n/a"}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Next wake</div>
            <div class="stat-value">${Xt(e.status?.nextWakeAtMs??null)}</div>
          </div>
        </div>
        ${e.error?o`<div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:f}
      </section>
    </section>
    <section class="card">
      <div class="card-title">Agent Cron Jobs</div>
      <div class="card-sub">Scheduled jobs targeting this agent.</div>
      ${n.length===0?o`
              <div class="muted" style="margin-top: 16px">No jobs assigned.</div>
            `:o`
              <div class="list" style="margin-top: 16px;">
                ${n.map(i=>o`
                  <div class="list-item">
                    <div class="list-main">
                      <div class="list-title">${i.name}</div>
                      ${i.description?o`<div class="list-sub">${i.description}</div>`:f}
                      <div class="chip-row" style="margin-top: 6px;">
                        <span class="chip">${is(i)}</span>
                        <span class="chip ${i.enabled?"chip-ok":"chip-warn"}">
                          ${i.enabled?"enabled":"disabled"}
                        </span>
                        <span class="chip">${i.sessionTarget}</span>
                      </div>
                    </div>
                    <div class="list-meta">
                      <div class="mono">${ns(i)}</div>
                      <div class="muted">${ss(i)}</div>
                    </div>
                  </div>
                `)}
              </div>
            `}
    </section>
  `}function gr(e){const t=e.agentFilesList?.agentId===e.agentId?e.agentFilesList:null,n=t?.files??[],i=e.agentFileActive??null,s=i?n.find(d=>d.name===i)??null:null,a=i?e.agentFileContents[i]??"":"",l=i?e.agentFileDrafts[i]??a:"",r=i?l!==a:!1;return o`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Core Files</div>
          <div class="card-sub">Bootstrap persona, identity, and tool guidance.</div>
        </div>
        <button
          class="btn btn--sm"
          ?disabled=${e.agentFilesLoading}
          @click=${()=>e.onLoadFiles(e.agentId)}
        >
          ${e.agentFilesLoading?"Loading…":"Refresh"}
        </button>
      </div>
      ${t?o`<div class="muted mono" style="margin-top: 8px;">Workspace: ${t.workspace}</div>`:f}
      ${e.agentFilesError?o`<div class="callout danger" style="margin-top: 12px;">${e.agentFilesError}</div>`:f}
      ${t?o`
              <div class="agent-files-grid" style="margin-top: 16px;">
                <div class="agent-files-list">
                  ${n.length===0?o`
                          <div class="muted">No files found.</div>
                        `:n.map(d=>fr(d,i,()=>e.onSelectFile(d.name)))}
                </div>
                <div class="agent-files-editor">
                  ${s?o`
                          <div class="agent-file-header">
                            <div>
                              <div class="agent-file-title mono">${s.name}</div>
                              <div class="agent-file-sub mono">${s.path}</div>
                            </div>
                            <div class="agent-file-actions">
                              <button
                                class="btn btn--sm"
                                ?disabled=${!r}
                                @click=${()=>e.onFileReset(s.name)}
                              >
                                Reset
                              </button>
                              <button
                                class="btn btn--sm primary"
                                ?disabled=${e.agentFileSaving||!r}
                                @click=${()=>e.onFileSave(s.name)}
                              >
                                ${e.agentFileSaving?"Saving…":"Save"}
                              </button>
                            </div>
                          </div>
                          ${s.missing?o`
                                  <div class="callout info" style="margin-top: 10px">
                                    This file is missing. Saving will create it in the agent workspace.
                                  </div>
                                `:f}
                          <label class="field" style="margin-top: 12px;">
                            <span>Content</span>
                            <textarea
                              .value=${l}
                              @input=${d=>e.onFileDraftChange(s.name,d.target.value)}
                            ></textarea>
                          </label>
                        `:o`
                          <div class="muted">Select a file to edit.</div>
                        `}
                </div>
              </div>
            `:o`
              <div class="callout info" style="margin-top: 12px">
                Load the agent workspace files to edit core instructions.
              </div>
            `}
    </section>
  `}function fr(e,t,n){const i=e.missing?"Missing":`${ql(e.size)} · ${T(e.updatedAtMs??null)}`;return o`
    <button
      type="button"
      class="agent-file-row ${t===e.name?"active":""}"
      @click=${n}
    >
      <div>
        <div class="agent-file-name mono">${e.name}</div>
        <div class="agent-file-meta">${i}</div>
      </div>
      ${e.missing?o`
              <span class="agent-pill warn">missing</span>
            `:f}
    </button>
  `}function vr(e){const t=Ye(e.configForm,e.agentId),n=t.entry?.tools??{},i=t.globalTools??{},s=n.profile??i.profile??"full",a=n.profile?"agent override":i.profile?"global default":"default",l=Array.isArray(n.allow)&&n.allow.length>0,r=Array.isArray(i.allow)&&i.allow.length>0,d=!!e.configForm&&!e.configLoading&&!e.configSaving&&!l,g=l?[]:Array.isArray(n.alsoAllow)?n.alsoAllow:[],p=l?[]:Array.isArray(n.deny)?n.deny:[],v=l?{allow:n.allow??[],deny:n.deny??[]}:Kl(s)??void 0,c=xn.flatMap(S=>S.tools.map(k=>k.id)),u=S=>{const k=Xl(S,v),C=In(S,g),L=In(S,p);return{allowed:(k||C)&&!L,baseAllowed:k,denied:L}},b=c.filter(S=>u(S).allowed).length,w=(S,k)=>{const C=new Set(g.map(_=>K(_)).filter(_=>_.length>0)),L=new Set(p.map(_=>K(_)).filter(_=>_.length>0)),I=u(S).baseAllowed,x=K(S);k?(L.delete(x),I||C.add(x)):(C.delete(x),L.add(x)),e.onOverridesChange(e.agentId,[...C],[...L])},$=S=>{const k=new Set(g.map(L=>K(L)).filter(L=>L.length>0)),C=new Set(p.map(L=>K(L)).filter(L=>L.length>0));for(const L of c){const I=u(L).baseAllowed,x=K(L);S?(C.delete(x),I||k.add(x)):(k.delete(x),C.add(x))}e.onOverridesChange(e.agentId,[...k],[...C])};return o`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Tool Access</div>
          <div class="card-sub">
            Profile + per-tool overrides for this agent.
            <span class="mono">${b}/${c.length}</span> enabled.
          </div>
        </div>
        <div class="row" style="gap: 8px;">
          <button
            class="btn btn--sm"
            ?disabled=${!d}
            @click=${()=>$(!0)}
          >
            Enable All
          </button>
          <button
            class="btn btn--sm"
            ?disabled=${!d}
            @click=${()=>$(!1)}
          >
            Disable All
          </button>
          <button
            class="btn btn--sm"
            ?disabled=${e.configLoading}
            @click=${e.onConfigReload}
          >
            Reload Config
          </button>
          <button
            class="btn btn--sm primary"
            ?disabled=${e.configSaving||!e.configDirty}
            @click=${e.onConfigSave}
          >
            ${e.configSaving?"Saving…":"Save"}
          </button>
        </div>
      </div>

      ${e.configForm?f:o`
              <div class="callout info" style="margin-top: 12px">
                Load the gateway config to adjust tool profiles.
              </div>
            `}
      ${l?o`
              <div class="callout info" style="margin-top: 12px">
                This agent is using an explicit allowlist in config. Tool overrides are managed in the Config tab.
              </div>
            `:f}
      ${r?o`
              <div class="callout info" style="margin-top: 12px">
                Global tools.allow is set. Agent overrides cannot enable tools that are globally blocked.
              </div>
            `:f}

      <div class="agent-tools-meta" style="margin-top: 16px;">
        <div class="agent-kv">
          <div class="label">Profile</div>
          <div class="mono">${s}</div>
        </div>
        <div class="agent-kv">
          <div class="label">Source</div>
          <div>${a}</div>
        </div>
        ${e.configDirty?o`
                <div class="agent-kv">
                  <div class="label">Status</div>
                  <div class="mono">unsaved</div>
                </div>
              `:f}
      </div>

      <div class="agent-tools-presets" style="margin-top: 16px;">
        <div class="label">Quick Presets</div>
        <div class="agent-tools-buttons">
          ${Vl.map(S=>o`
              <button
                class="btn btn--sm ${s===S.id?"active":""}"
                ?disabled=${!d}
                @click=${()=>e.onProfileChange(e.agentId,S.id,!0)}
              >
                ${S.label}
              </button>
            `)}
          <button
            class="btn btn--sm"
            ?disabled=${!d}
            @click=${()=>e.onProfileChange(e.agentId,null,!1)}
          >
            Inherit
          </button>
        </div>
      </div>

      <div class="agent-tools-grid" style="margin-top: 20px;">
        ${xn.map(S=>o`
            <div class="agent-tools-section">
              <div class="agent-tools-header">${S.label}</div>
              <div class="agent-tools-list">
                ${S.tools.map(k=>{const{allowed:C}=u(k.id);return o`
                    <div class="agent-tool-row">
                      <div>
                        <div class="agent-tool-title mono">${k.label}</div>
                        <div class="agent-tool-sub">${k.description}</div>
                      </div>
                      <label class="cfg-toggle">
                        <input
                          type="checkbox"
                          .checked=${C}
                          ?disabled=${!d}
                          @change=${L=>w(k.id,L.target.checked)}
                        />
                        <span class="cfg-toggle__track"></span>
                      </label>
                    </div>
                  `})}
              </div>
            </div>
          `)}
      </div>
    </section>
  `}const ut=[{id:"workspace",label:"Workspace Skills",sources:["openclaw-workspace"]},{id:"built-in",label:"Built-in Skills",sources:["openclaw-bundled"]},{id:"installed",label:"Installed Skills",sources:["openclaw-managed"]},{id:"extra",label:"Extra Skills",sources:["openclaw-extra"]}];function pr(e){const t=new Map;for(const s of ut)t.set(s.id,{id:s.id,label:s.label,skills:[]});const n={id:"other",label:"Other Skills",skills:[]};for(const s of e){const a=ut.find(l=>l.sources.includes(s.source));a?t.get(a.id)?.skills.push(s):n.skills.push(s)}const i=ut.map(s=>t.get(s.id)).filter(s=>!!(s&&s.skills.length>0));return n.skills.length>0&&i.push(n),i}function hr(e){const t=!!e.configForm&&!e.configLoading&&!e.configSaving,n=Ye(e.configForm,e.agentId),i=Array.isArray(n.entry?.skills)?n.entry?.skills:void 0,s=new Set((i??[]).map(u=>u.trim()).filter(Boolean)),a=i!==void 0,l=!!(e.report&&e.activeAgentId===e.agentId),r=l?e.report?.skills??[]:[],d=e.filter.trim().toLowerCase(),g=d?r.filter(u=>[u.name,u.description,u.source].join(" ").toLowerCase().includes(d)):r,p=pr(g),v=a?r.filter(u=>s.has(u.name)).length:r.length,c=r.length;return o`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Skills</div>
          <div class="card-sub">
            Per-agent skill allowlist and workspace skills.
            ${c>0?o`<span class="mono">${v}/${c}</span>`:f}
          </div>
        </div>
        <div class="row" style="gap: 8px;">
          <button class="btn btn--sm" ?disabled=${!t} @click=${()=>e.onClear(e.agentId)}>
            Use All
          </button>
          <button class="btn btn--sm" ?disabled=${!t} @click=${()=>e.onDisableAll(e.agentId)}>
            Disable All
          </button>
          <button
            class="btn btn--sm"
            ?disabled=${e.configLoading}
            @click=${e.onConfigReload}
          >
            Reload Config
          </button>
          <button class="btn btn--sm" ?disabled=${e.loading} @click=${e.onRefresh}>
            ${e.loading?"Loading…":"Refresh"}
          </button>
          <button
            class="btn btn--sm primary"
            ?disabled=${e.configSaving||!e.configDirty}
            @click=${e.onConfigSave}
          >
            ${e.configSaving?"Saving…":"Save"}
          </button>
        </div>
      </div>

      ${e.configForm?f:o`
              <div class="callout info" style="margin-top: 12px">
                Load the gateway config to set per-agent skills.
              </div>
            `}
      ${a?o`
              <div class="callout info" style="margin-top: 12px">This agent uses a custom skill allowlist.</div>
            `:o`
              <div class="callout info" style="margin-top: 12px">
                All skills are enabled. Disabling any skill will create a per-agent allowlist.
              </div>
            `}
      ${!l&&!e.loading?o`
              <div class="callout info" style="margin-top: 12px">
                Load skills for this agent to view workspace-specific entries.
              </div>
            `:f}
      ${e.error?o`<div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:f}

      <div class="filters" style="margin-top: 14px;">
        <label class="field" style="flex: 1;">
          <span>Filter</span>
          <input
            .value=${e.filter}
            @input=${u=>e.onFilterChange(u.target.value)}
            placeholder="Search skills"
          />
        </label>
        <div class="muted">${g.length} shown</div>
      </div>

      ${g.length===0?o`
              <div class="muted" style="margin-top: 16px">No skills found.</div>
            `:o`
              <div class="agent-skills-groups" style="margin-top: 16px;">
                ${p.map(u=>mr(u,{agentId:e.agentId,allowSet:s,usingAllowlist:a,editable:t,onToggle:e.onToggle}))}
              </div>
            `}
    </section>
  `}function mr(e,t){const n=e.id==="workspace"||e.id==="built-in";return o`
    <details class="agent-skills-group" ?open=${!n}>
      <summary class="agent-skills-header">
        <span>${e.label}</span>
        <span class="muted">${e.skills.length}</span>
      </summary>
      <div class="list skills-grid">
        ${e.skills.map(i=>yr(i,{agentId:t.agentId,allowSet:t.allowSet,usingAllowlist:t.usingAllowlist,editable:t.editable,onToggle:t.onToggle}))}
      </div>
    </details>
  `}function yr(e,t){const n=t.usingAllowlist?t.allowSet.has(e.name):!0,i=[...e.missing.bins.map(a=>`bin:${a}`),...e.missing.env.map(a=>`env:${a}`),...e.missing.config.map(a=>`config:${a}`),...e.missing.os.map(a=>`os:${a}`)],s=[];return e.disabled&&s.push("disabled"),e.blockedByAllowlist&&s.push("blocked by allowlist"),o`
    <div class="list-item agent-skill-row">
      <div class="list-main">
        <div class="list-title">
          ${e.emoji?`${e.emoji} `:""}${e.name}
        </div>
        <div class="list-sub">${e.description}</div>
        <div class="chip-row" style="margin-top: 6px;">
          <span class="chip">${e.source}</span>
          <span class="chip ${e.eligible?"chip-ok":"chip-warn"}">
            ${e.eligible?"eligible":"blocked"}
          </span>
          ${e.disabled?o`
                  <span class="chip chip-warn">disabled</span>
                `:f}
        </div>
        ${i.length>0?o`<div class="muted" style="margin-top: 6px;">Missing: ${i.join(", ")}</div>`:f}
        ${s.length>0?o`<div class="muted" style="margin-top: 6px;">Reason: ${s.join(", ")}</div>`:f}
      </div>
      <div class="list-meta">
        <label class="cfg-toggle">
          <input
            type="checkbox"
            .checked=${n}
            ?disabled=${!t.editable}
            @change=${a=>t.onToggle(t.agentId,e.name,a.target.checked)}
          />
          <span class="cfg-toggle__track"></span>
        </label>
      </div>
    </div>
  `}function U(e){if(e)return Array.isArray(e.type)?e.type.filter(n=>n!=="null")[0]??e.type[0]:e.type}function rs(e){if(!e)return"";if(e.default!==void 0)return e.default;switch(U(e)){case"object":return{};case"array":return[];case"boolean":return!1;case"number":case"integer":return 0;case"string":return"";default:return""}}function Qe(e){return e.filter(t=>typeof t=="string").join(".")}function D(e,t){const n=Qe(e),i=t[n];if(i)return i;const s=n.split(".");for(const[a,l]of Object.entries(t)){if(!a.includes("*"))continue;const r=a.split(".");if(r.length!==s.length)continue;let d=!0;for(let g=0;g<s.length;g+=1)if(r[g]!=="*"&&r[g]!==s[g]){d=!1;break}if(d)return l}}function q(e){return e.replace(/_/g," ").replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/\s+/g," ").replace(/^./,t=>t.toUpperCase())}function br(e){const t=Qe(e).toLowerCase();return t.includes("token")||t.includes("password")||t.includes("secret")||t.includes("apikey")||t.endsWith("key")}const wr=new Set(["title","description","default","nullable"]);function $r(e){return Object.keys(e??{}).filter(n=>!wr.has(n)).length===0}function Sr(e){if(e===void 0)return"";try{return JSON.stringify(e,null,2)??""}catch{return""}}const $e={chevronDown:o`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `,plus:o`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `,minus:o`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `,trash:o`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `,edit:o`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  `};function V(e){const{schema:t,value:n,path:i,hints:s,unsupported:a,disabled:l,onPatch:r}=e,d=e.showLabel??!0,g=U(t),p=D(i,s),v=p?.label??t.title??q(String(i.at(-1))),c=p?.help??t.description,u=Qe(i);if(a.has(u))return o`<div class="cfg-field cfg-field--error">
      <div class="cfg-field__label">${v}</div>
      <div class="cfg-field__error">Unsupported schema node. Use Raw mode.</div>
    </div>`;if(t.anyOf||t.oneOf){const w=(t.anyOf??t.oneOf??[]).filter(I=>!(I.type==="null"||Array.isArray(I.type)&&I.type.includes("null")));if(w.length===1)return V({...e,schema:w[0]});const $=I=>{if(I.const!==void 0)return I.const;if(I.enum&&I.enum.length===1)return I.enum[0]},S=w.map($),k=S.every(I=>I!==void 0);if(k&&S.length>0&&S.length<=5){const I=n??t.default;return o`
        <div class="cfg-field">
          ${d?o`<label class="cfg-field__label">${v}</label>`:f}
          ${c?o`<div class="cfg-field__help">${c}</div>`:f}
          <div class="cfg-segmented">
            ${S.map(x=>o`
              <button
                type="button"
                class="cfg-segmented__btn ${x===I||String(x)===String(I)?"active":""}"
                ?disabled=${l}
                @click=${()=>r(i,x)}
              >
                ${String(x)}
              </button>
            `)}
          </div>
        </div>
      `}if(k&&S.length>5)return _n({...e,options:S,value:n??t.default});const C=new Set(w.map(I=>U(I)).filter(Boolean)),L=new Set([...C].map(I=>I==="integer"?"number":I));if([...L].every(I=>["string","number","boolean"].includes(I))){const I=L.has("string"),x=L.has("number");if(L.has("boolean")&&L.size===1)return V({...e,schema:{...t,type:"boolean",anyOf:void 0,oneOf:void 0}});if(I||x)return Ln({...e,inputType:x&&!I?"number":"text"})}}if(t.enum){const b=t.enum;if(b.length<=5){const w=n??t.default;return o`
        <div class="cfg-field">
          ${d?o`<label class="cfg-field__label">${v}</label>`:f}
          ${c?o`<div class="cfg-field__help">${c}</div>`:f}
          <div class="cfg-segmented">
            ${b.map($=>o`
              <button
                type="button"
                class="cfg-segmented__btn ${$===w||String($)===String(w)?"active":""}"
                ?disabled=${l}
                @click=${()=>r(i,$)}
              >
                ${String($)}
              </button>
            `)}
          </div>
        </div>
      `}return _n({...e,options:b,value:n??t.default})}if(g==="object")return xr(e);if(g==="array")return Ar(e);if(g==="boolean"){const b=typeof n=="boolean"?n:typeof t.default=="boolean"?t.default:!1;return o`
      <label class="cfg-toggle-row ${l?"disabled":""}">
        <div class="cfg-toggle-row__content">
          <span class="cfg-toggle-row__label">${v}</span>
          ${c?o`<span class="cfg-toggle-row__help">${c}</span>`:f}
        </div>
        <div class="cfg-toggle">
          <input
            type="checkbox"
            .checked=${b}
            ?disabled=${l}
            @change=${w=>r(i,w.target.checked)}
          />
          <span class="cfg-toggle__track"></span>
        </div>
      </label>
    `}return g==="number"||g==="integer"?kr(e):g==="string"?Ln({...e,inputType:"text"}):o`
    <div class="cfg-field cfg-field--error">
      <div class="cfg-field__label">${v}</div>
      <div class="cfg-field__error">Unsupported type: ${g}. Use Raw mode.</div>
    </div>
  `}function Ln(e){const{schema:t,value:n,path:i,hints:s,disabled:a,onPatch:l,inputType:r}=e,d=e.showLabel??!0,g=D(i,s),p=g?.label??t.title??q(String(i.at(-1))),v=g?.help??t.description,c=g?.sensitive??br(i),u=g?.placeholder??(c?"••••":t.default!==void 0?`Default: ${String(t.default)}`:""),b=n??"";return o`
    <div class="cfg-field">
      ${d?o`<label class="cfg-field__label">${p}</label>`:f}
      ${v?o`<div class="cfg-field__help">${v}</div>`:f}
      <div class="cfg-input-wrap">
        <input
          type=${c?"password":r}
          class="cfg-input"
          placeholder=${u}
          .value=${b==null?"":String(b)}
          ?disabled=${a}
          @input=${w=>{const $=w.target.value;if(r==="number"){if($.trim()===""){l(i,void 0);return}const S=Number($);l(i,Number.isNaN(S)?$:S);return}l(i,$)}}
          @change=${w=>{if(r==="number")return;const $=w.target.value;l(i,$.trim())}}
        />
        ${t.default!==void 0?o`
          <button
            type="button"
            class="cfg-input__reset"
            title="Reset to default"
            ?disabled=${a}
            @click=${()=>l(i,t.default)}
          >↺</button>
        `:f}
      </div>
    </div>
  `}function kr(e){const{schema:t,value:n,path:i,hints:s,disabled:a,onPatch:l}=e,r=e.showLabel??!0,d=D(i,s),g=d?.label??t.title??q(String(i.at(-1))),p=d?.help??t.description,v=n??t.default??"",c=typeof v=="number"?v:0;return o`
    <div class="cfg-field">
      ${r?o`<label class="cfg-field__label">${g}</label>`:f}
      ${p?o`<div class="cfg-field__help">${p}</div>`:f}
      <div class="cfg-number">
        <button
          type="button"
          class="cfg-number__btn"
          ?disabled=${a}
          @click=${()=>l(i,c-1)}
        >−</button>
        <input
          type="number"
          class="cfg-number__input"
          .value=${v==null?"":String(v)}
          ?disabled=${a}
          @input=${u=>{const b=u.target.value,w=b===""?void 0:Number(b);l(i,w)}}
        />
        <button
          type="button"
          class="cfg-number__btn"
          ?disabled=${a}
          @click=${()=>l(i,c+1)}
        >+</button>
      </div>
    </div>
  `}function _n(e){const{schema:t,value:n,path:i,hints:s,disabled:a,options:l,onPatch:r}=e,d=e.showLabel??!0,g=D(i,s),p=g?.label??t.title??q(String(i.at(-1))),v=g?.help??t.description,c=n??t.default,u=l.findIndex(w=>w===c||String(w)===String(c)),b="__unset__";return o`
    <div class="cfg-field">
      ${d?o`<label class="cfg-field__label">${p}</label>`:f}
      ${v?o`<div class="cfg-field__help">${v}</div>`:f}
      <select
        class="cfg-select"
        ?disabled=${a}
        .value=${u>=0?String(u):b}
        @change=${w=>{const $=w.target.value;r(i,$===b?void 0:l[Number($)])}}
      >
        <option value=${b}>Select...</option>
        ${l.map((w,$)=>o`
          <option value=${String($)}>${String(w)}</option>
        `)}
      </select>
    </div>
  `}function xr(e){const{schema:t,value:n,path:i,hints:s,unsupported:a,disabled:l,onPatch:r}=e,d=D(i,s),g=d?.label??t.title??q(String(i.at(-1))),p=d?.help??t.description,v=n??t.default,c=v&&typeof v=="object"&&!Array.isArray(v)?v:{},u=t.properties??{},w=Object.entries(u).toSorted((C,L)=>{const I=D([...i,C[0]],s)?.order??0,x=D([...i,L[0]],s)?.order??0;return I!==x?I-x:C[0].localeCompare(L[0])}),$=new Set(Object.keys(u)),S=t.additionalProperties,k=!!S&&typeof S=="object";return i.length===1?o`
      <div class="cfg-fields">
        ${w.map(([C,L])=>V({schema:L,value:c[C],path:[...i,C],hints:s,unsupported:a,disabled:l,onPatch:r}))}
        ${k?Tn({schema:S,value:c,path:i,hints:s,unsupported:a,disabled:l,reservedKeys:$,onPatch:r}):f}
      </div>
    `:o`
    <details class="cfg-object" open>
      <summary class="cfg-object__header">
        <span class="cfg-object__title">${g}</span>
        <span class="cfg-object__chevron">${$e.chevronDown}</span>
      </summary>
      ${p?o`<div class="cfg-object__help">${p}</div>`:f}
      <div class="cfg-object__content">
        ${w.map(([C,L])=>V({schema:L,value:c[C],path:[...i,C],hints:s,unsupported:a,disabled:l,onPatch:r}))}
        ${k?Tn({schema:S,value:c,path:i,hints:s,unsupported:a,disabled:l,reservedKeys:$,onPatch:r}):f}
      </div>
    </details>
  `}function Ar(e){const{schema:t,value:n,path:i,hints:s,unsupported:a,disabled:l,onPatch:r}=e,d=e.showLabel??!0,g=D(i,s),p=g?.label??t.title??q(String(i.at(-1))),v=g?.help??t.description,c=Array.isArray(t.items)?t.items[0]:t.items;if(!c)return o`
      <div class="cfg-field cfg-field--error">
        <div class="cfg-field__label">${p}</div>
        <div class="cfg-field__error">Unsupported array schema. Use Raw mode.</div>
      </div>
    `;const u=Array.isArray(n)?n:Array.isArray(t.default)?t.default:[];return o`
    <div class="cfg-array">
      <div class="cfg-array__header">
        ${d?o`<span class="cfg-array__label">${p}</span>`:f}
        <span class="cfg-array__count">${u.length} item${u.length!==1?"s":""}</span>
        <button
          type="button"
          class="cfg-array__add"
          ?disabled=${l}
          @click=${()=>{const b=[...u,rs(c)];r(i,b)}}
        >
          <span class="cfg-array__add-icon">${$e.plus}</span>
          Add
        </button>
      </div>
      ${v?o`<div class="cfg-array__help">${v}</div>`:f}

      ${u.length===0?o`
              <div class="cfg-array__empty">No items yet. Click "Add" to create one.</div>
            `:o`
        <div class="cfg-array__items">
          ${u.map((b,w)=>o`
            <div class="cfg-array__item">
              <div class="cfg-array__item-header">
                <span class="cfg-array__item-index">#${w+1}</span>
                <button
                  type="button"
                  class="cfg-array__item-remove"
                  title="Remove item"
                  ?disabled=${l}
                  @click=${()=>{const $=[...u];$.splice(w,1),r(i,$)}}
                >
                  ${$e.trash}
                </button>
              </div>
              <div class="cfg-array__item-content">
                ${V({schema:c,value:b,path:[...i,w],hints:s,unsupported:a,disabled:l,showLabel:!1,onPatch:r})}
              </div>
            </div>
          `)}
        </div>
      `}
    </div>
  `}function Tn(e){const{schema:t,value:n,path:i,hints:s,unsupported:a,disabled:l,reservedKeys:r,onPatch:d}=e,g=$r(t),p=Object.entries(n??{}).filter(([v])=>!r.has(v));return o`
    <div class="cfg-map">
      <div class="cfg-map__header">
        <span class="cfg-map__label">Custom entries</span>
        <button
          type="button"
          class="cfg-map__add"
          ?disabled=${l}
          @click=${()=>{const v={...n};let c=1,u=`custom-${c}`;for(;u in v;)c+=1,u=`custom-${c}`;v[u]=g?{}:rs(t),d(i,v)}}
        >
          <span class="cfg-map__add-icon">${$e.plus}</span>
          Add Entry
        </button>
      </div>

      ${p.length===0?o`
              <div class="cfg-map__empty">No custom entries.</div>
            `:o`
        <div class="cfg-map__items">
          ${p.map(([v,c])=>{const u=[...i,v],b=Sr(c);return o`
              <div class="cfg-map__item">
                <div class="cfg-map__item-key">
                  <input
                    type="text"
                    class="cfg-input cfg-input--sm"
                    placeholder="Key"
                    .value=${v}
                    ?disabled=${l}
                    @change=${w=>{const $=w.target.value.trim();if(!$||$===v)return;const S={...n};$ in S||(S[$]=S[v],delete S[v],d(i,S))}}
                  />
                </div>
                <div class="cfg-map__item-value">
                  ${g?o`
                        <textarea
                          class="cfg-textarea cfg-textarea--sm"
                          placeholder="JSON value"
                          rows="2"
                          .value=${b}
                          ?disabled=${l}
                          @change=${w=>{const $=w.target,S=$.value.trim();if(!S){d(u,void 0);return}try{d(u,JSON.parse(S))}catch{$.value=b}}}
                        ></textarea>
                      `:V({schema:t,value:c,path:u,hints:s,unsupported:a,disabled:l,showLabel:!1,onPatch:d})}
                </div>
                <button
                  type="button"
                  class="cfg-map__item-remove"
                  title="Remove entry"
                  ?disabled=${l}
                  @click=${()=>{const w={...n};delete w[v],d(i,w)}}
                >
                  ${$e.trash}
                </button>
              </div>
            `})}
        </div>
      `}
    </div>
  `}const En={env:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="3"></circle>
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      ></path>
    </svg>
  `,update:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `,agents:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path
        d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"
      ></path>
      <circle cx="8" cy="14" r="1"></circle>
      <circle cx="16" cy="14" r="1"></circle>
    </svg>
  `,auth:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  `,channels:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `,messages:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  `,commands:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  `,hooks:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  `,skills:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      ></polygon>
    </svg>
  `,tools:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      ></path>
    </svg>
  `,gateway:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      ></path>
    </svg>
  `,wizard:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M15 4V2"></path>
      <path d="M15 16v-2"></path>
      <path d="M8 9h2"></path>
      <path d="M20 9h2"></path>
      <path d="M17.8 11.8 19 13"></path>
      <path d="M15 9h0"></path>
      <path d="M17.8 6.2 19 5"></path>
      <path d="m3 21 9-9"></path>
      <path d="M12.2 6.2 11 5"></path>
    </svg>
  `,meta:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    </svg>
  `,logging:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  `,browser:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="4"></circle>
      <line x1="21.17" y1="8" x2="12" y2="8"></line>
      <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
      <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
    </svg>
  `,ui:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  `,models:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      ></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  `,bindings:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
  `,broadcast:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
      <circle cx="12" cy="12" r="2"></circle>
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
    </svg>
  `,audio:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>
  `,session:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  `,cron:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  `,web:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      ></path>
    </svg>
  `,discovery:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `,canvasHost:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  `,talk:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  `,plugins:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M12 2v6"></path>
      <path d="m4.93 10.93 4.24 4.24"></path>
      <path d="M2 12h6"></path>
      <path d="m4.93 13.07 4.24-4.24"></path>
      <path d="M12 22v-6"></path>
      <path d="m19.07 13.07-4.24-4.24"></path>
      <path d="M22 12h-6"></path>
      <path d="m19.07 10.93-4.24 4.24"></path>
    </svg>
  `,default:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  `},Zt={env:{label:"Environment Variables",description:"Environment variables passed to the gateway process"},update:{label:"Updates",description:"Auto-update settings and release channel"},agents:{label:"Agents",description:"Agent configurations, models, and identities"},auth:{label:"Authentication",description:"API keys and authentication profiles"},channels:{label:"Channels",description:"Messaging channels (Telegram, Discord, Slack, etc.)"},messages:{label:"Messages",description:"Message handling and routing settings"},commands:{label:"Commands",description:"Custom slash commands"},hooks:{label:"Hooks",description:"Webhooks and event hooks"},skills:{label:"Skills",description:"Skill packs and capabilities"},tools:{label:"Tools",description:"Tool configurations (browser, search, etc.)"},gateway:{label:"Gateway",description:"Gateway server settings (port, auth, binding)"},wizard:{label:"Setup Wizard",description:"Setup wizard state and history"},meta:{label:"Metadata",description:"Gateway metadata and version information"},logging:{label:"Logging",description:"Log levels and output configuration"},browser:{label:"Browser",description:"Browser automation settings"},ui:{label:"UI",description:"User interface preferences"},models:{label:"Models",description:"AI model configurations and providers"},bindings:{label:"Bindings",description:"Key bindings and shortcuts"},broadcast:{label:"Broadcast",description:"Broadcast and notification settings"},audio:{label:"Audio",description:"Audio input/output settings"},session:{label:"Session",description:"Session management and persistence"},cron:{label:"Cron",description:"Scheduled tasks and automation"},web:{label:"Web",description:"Web server and API settings"},discovery:{label:"Discovery",description:"Service discovery and networking"},canvasHost:{label:"Canvas Host",description:"Canvas rendering and display"},talk:{label:"Talk",description:"Voice and speech settings"},plugins:{label:"Plugins",description:"Plugin management and extensions"}};function Mn(e){return En[e]??En.default}function Cr(e,t,n){if(!n)return!0;const i=n.toLowerCase(),s=Zt[e];return e.toLowerCase().includes(i)||s&&(s.label.toLowerCase().includes(i)||s.description.toLowerCase().includes(i))?!0:ce(t,i)}function ce(e,t){if(e.title?.toLowerCase().includes(t)||e.description?.toLowerCase().includes(t)||e.enum?.some(i=>String(i).toLowerCase().includes(t)))return!0;if(e.properties){for(const[i,s]of Object.entries(e.properties))if(i.toLowerCase().includes(t)||ce(s,t))return!0}if(e.items){const i=Array.isArray(e.items)?e.items:[e.items];for(const s of i)if(s&&ce(s,t))return!0}if(e.additionalProperties&&typeof e.additionalProperties=="object"&&ce(e.additionalProperties,t))return!0;const n=e.anyOf??e.oneOf??e.allOf;if(n){for(const i of n)if(i&&ce(i,t))return!0}return!1}function Ir(e){if(!e.schema)return o`
      <div class="muted">Schema unavailable.</div>
    `;const t=e.schema,n=e.value??{};if(U(t)!=="object"||!t.properties)return o`
      <div class="callout danger">Unsupported schema. Use Raw.</div>
    `;const i=new Set(e.unsupportedPaths??[]),s=t.properties,a=e.searchQuery??"",l=e.activeSection,r=e.activeSubsection??null,g=Object.entries(s).toSorted((v,c)=>{const u=D([v[0]],e.uiHints)?.order??50,b=D([c[0]],e.uiHints)?.order??50;return u!==b?u-b:v[0].localeCompare(c[0])}).filter(([v,c])=>!(l&&v!==l||a&&!Cr(v,c,a)));let p=null;if(l&&r&&g.length===1){const v=g[0]?.[1];v&&U(v)==="object"&&v.properties&&v.properties[r]&&(p={sectionKey:l,subsectionKey:r,schema:v.properties[r]})}return g.length===0?o`
      <div class="config-empty">
        <div class="config-empty__icon">${M.search}</div>
        <div class="config-empty__text">
          ${a?`No settings match "${a}"`:"No settings in this section"}
        </div>
      </div>
    `:o`
    <div class="config-form config-form--modern">
      ${p?(()=>{const{sectionKey:v,subsectionKey:c,schema:u}=p,b=D([v,c],e.uiHints),w=b?.label??u.title??q(c),$=b?.help??u.description??"",S=n[v],k=S&&typeof S=="object"?S[c]:void 0,C=`config-section-${v}-${c}`;return o`
              <section class="config-section-card" id=${C}>
                <div class="config-section-card__header">
                  <span class="config-section-card__icon">${Mn(v)}</span>
                  <div class="config-section-card__titles">
                    <h3 class="config-section-card__title">${w}</h3>
                    ${$?o`<p class="config-section-card__desc">${$}</p>`:f}
                  </div>
                </div>
                <div class="config-section-card__content">
                  ${V({schema:u,value:k,path:[v,c],hints:e.uiHints,unsupported:i,disabled:e.disabled??!1,showLabel:!1,onPatch:e.onPatch})}
                </div>
              </section>
            `})():g.map(([v,c])=>{const u=Zt[v]??{label:v.charAt(0).toUpperCase()+v.slice(1),description:c.description??""};return o`
              <section class="config-section-card" id="config-section-${v}">
                <div class="config-section-card__header">
                  <span class="config-section-card__icon">${Mn(v)}</span>
                  <div class="config-section-card__titles">
                    <h3 class="config-section-card__title">${u.label}</h3>
                    ${u.description?o`<p class="config-section-card__desc">${u.description}</p>`:f}
                  </div>
                </div>
                <div class="config-section-card__content">
                  ${V({schema:c,value:n[v],path:[v],hints:e.uiHints,unsupported:i,disabled:e.disabled??!1,showLabel:!1,onPatch:e.onPatch})}
                </div>
              </section>
            `})}
    </div>
  `}const Lr=new Set(["title","description","default","nullable"]);function _r(e){return Object.keys(e??{}).filter(n=>!Lr.has(n)).length===0}function cs(e){const t=e.filter(s=>s!=null),n=t.length!==e.length,i=[];for(const s of t)i.some(a=>Object.is(a,s))||i.push(s);return{enumValues:i,nullable:n}}function ds(e){return!e||typeof e!="object"?{schema:null,unsupportedPaths:["<root>"]}:fe(e,[])}function fe(e,t){const n=new Set,i={...e},s=Qe(t)||"<root>";if(e.anyOf||e.oneOf||e.allOf){const r=Tr(e,t);return r||{schema:e,unsupportedPaths:[s]}}const a=Array.isArray(e.type)&&e.type.includes("null"),l=U(e)??(e.properties||e.additionalProperties?"object":void 0);if(i.type=l??e.type,i.nullable=a||e.nullable,i.enum){const{enumValues:r,nullable:d}=cs(i.enum);i.enum=r,d&&(i.nullable=!0),r.length===0&&n.add(s)}if(l==="object"){const r=e.properties??{},d={};for(const[g,p]of Object.entries(r)){const v=fe(p,[...t,g]);v.schema&&(d[g]=v.schema);for(const c of v.unsupportedPaths)n.add(c)}if(i.properties=d,e.additionalProperties===!0)n.add(s);else if(e.additionalProperties===!1)i.additionalProperties=!1;else if(e.additionalProperties&&typeof e.additionalProperties=="object"&&!_r(e.additionalProperties)){const g=fe(e.additionalProperties,[...t,"*"]);i.additionalProperties=g.schema??e.additionalProperties,g.unsupportedPaths.length>0&&n.add(s)}}else if(l==="array"){const r=Array.isArray(e.items)?e.items[0]:e.items;if(!r)n.add(s);else{const d=fe(r,[...t,"*"]);i.items=d.schema??r,d.unsupportedPaths.length>0&&n.add(s)}}else l!=="string"&&l!=="number"&&l!=="integer"&&l!=="boolean"&&!i.enum&&n.add(s);return{schema:i,unsupportedPaths:Array.from(n)}}function Tr(e,t){if(e.allOf)return null;const n=e.anyOf??e.oneOf;if(!n)return null;const i=[],s=[];let a=!1;for(const r of n){if(!r||typeof r!="object")return null;if(Array.isArray(r.enum)){const{enumValues:d,nullable:g}=cs(r.enum);i.push(...d),g&&(a=!0);continue}if("const"in r){if(r.const==null){a=!0;continue}i.push(r.const);continue}if(U(r)==="null"){a=!0;continue}s.push(r)}if(i.length>0&&s.length===0){const r=[];for(const d of i)r.some(g=>Object.is(g,d))||r.push(d);return{schema:{...e,enum:r,nullable:a,anyOf:void 0,oneOf:void 0,allOf:void 0},unsupportedPaths:[]}}if(s.length===1){const r=fe(s[0],t);return r.schema&&(r.schema.nullable=a||r.schema.nullable),r}const l=new Set(["string","number","integer","boolean"]);return s.length>0&&i.length===0&&s.every(r=>r.type&&l.has(String(r.type)))?{schema:{...e,nullable:a},unsupportedPaths:[]}:null}function Er(e,t){let n=e;for(const i of t){if(!n)return null;const s=U(n);if(s==="object"){const a=n.properties??{};if(typeof i=="string"&&a[i]){n=a[i];continue}const l=n.additionalProperties;if(typeof i=="string"&&l&&typeof l=="object"){n=l;continue}return null}if(s==="array"){if(typeof i!="number")return null;n=(Array.isArray(n.items)?n.items[0]:n.items)??null;continue}return null}return n}function Mr(e,t){const i=(e.channels??{})[t],s=e[t];return(i&&typeof i=="object"?i:null)??(s&&typeof s=="object"?s:null)??{}}const Fr=["groupPolicy","streamMode","dmPolicy"];function Rr(e){if(e==null)return"n/a";if(typeof e=="string"||typeof e=="number"||typeof e=="boolean")return String(e);try{return JSON.stringify(e)}catch{return"n/a"}}function Pr(e){const t=Fr.flatMap(n=>n in e?[[n,e[n]]]:[]);return t.length===0?null:o`
    <div class="status-list" style="margin-top: 12px;">
      ${t.map(([n,i])=>o`
          <div>
            <span class="label">${n}</span>
            <span>${Rr(i)}</span>
          </div>
        `)}
    </div>
  `}function Nr(e){const t=ds(e.schema),n=t.schema;if(!n)return o`
      <div class="callout danger">Schema unavailable. Use Raw.</div>
    `;const i=Er(n,["channels",e.channelId]);if(!i)return o`
      <div class="callout danger">Channel config schema unavailable.</div>
    `;const s=e.configValue??{},a=Mr(s,e.channelId);return o`
    <div class="config-form">
      ${V({schema:i,value:a,path:["channels",e.channelId],hints:e.uiHints,unsupported:new Set(t.unsupportedPaths),disabled:e.disabled,showLabel:!1,onPatch:e.onPatch})}
    </div>
    ${Pr(a)}
  `}function G(e){const{channelId:t,props:n}=e,i=n.configSaving||n.configSchemaLoading;return o`
    <div style="margin-top: 16px;">
      ${n.configSchemaLoading?o`
              <div class="muted">Loading config schema…</div>
            `:Nr({channelId:t,configValue:n.configForm,schema:n.configSchema,uiHints:n.configUiHints,disabled:i,onPatch:n.onConfigPatch})}
      <div class="row" style="margin-top: 12px;">
        <button
          class="btn primary"
          ?disabled=${i||!n.configFormDirty}
          @click=${()=>n.onConfigSave()}
        >
          ${n.configSaving?"Saving…":"Save"}
        </button>
        <button
          class="btn"
          ?disabled=${i}
          @click=${()=>n.onConfigReload()}
        >
          Reload
        </button>
      </div>
    </div>
  `}function Br(e){const{props:t,discord:n,accountCountLabel:i}=e;return o`
    <div class="card">
      <div class="card-title">Discord</div>
      <div class="card-sub">Bot status and channel configuration.</div>
      ${i}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span>${n?.configured?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Running</span>
          <span>${n?.running?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Last start</span>
          <span>${n?.lastStartAt?T(n.lastStartAt):"n/a"}</span>
        </div>
        <div>
          <span class="label">Last probe</span>
          <span>${n?.lastProbeAt?T(n.lastProbeAt):"n/a"}</span>
        </div>
      </div>

      ${n?.lastError?o`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:f}

      ${n?.probe?o`<div class="callout" style="margin-top: 12px;">
            Probe ${n.probe.ok?"ok":"failed"} ·
            ${n.probe.status??""} ${n.probe.error??""}
          </div>`:f}

      ${G({channelId:"discord",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          Probe
        </button>
      </div>
    </div>
  `}function Dr(e){const{props:t,googleChat:n,accountCountLabel:i}=e;return o`
    <div class="card">
      <div class="card-title">Google Chat</div>
      <div class="card-sub">Chat API webhook status and channel configuration.</div>
      ${i}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span>${n?n.configured?"Yes":"No":"n/a"}</span>
        </div>
        <div>
          <span class="label">Running</span>
          <span>${n?n.running?"Yes":"No":"n/a"}</span>
        </div>
        <div>
          <span class="label">Credential</span>
          <span>${n?.credentialSource??"n/a"}</span>
        </div>
        <div>
          <span class="label">Audience</span>
          <span>
            ${n?.audienceType?`${n.audienceType}${n.audience?` · ${n.audience}`:""}`:"n/a"}
          </span>
        </div>
        <div>
          <span class="label">Last start</span>
          <span>${n?.lastStartAt?T(n.lastStartAt):"n/a"}</span>
        </div>
        <div>
          <span class="label">Last probe</span>
          <span>${n?.lastProbeAt?T(n.lastProbeAt):"n/a"}</span>
        </div>
      </div>

      ${n?.lastError?o`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:f}

      ${n?.probe?o`<div class="callout" style="margin-top: 12px;">
            Probe ${n.probe.ok?"ok":"failed"} ·
            ${n.probe.status??""} ${n.probe.error??""}
          </div>`:f}

      ${G({channelId:"googlechat",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          Probe
        </button>
      </div>
    </div>
  `}function Or(e){const{props:t,imessage:n,accountCountLabel:i}=e;return o`
    <div class="card">
      <div class="card-title">iMessage</div>
      <div class="card-sub">macOS bridge status and channel configuration.</div>
      ${i}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span>${n?.configured?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Running</span>
          <span>${n?.running?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Last start</span>
          <span>${n?.lastStartAt?T(n.lastStartAt):"n/a"}</span>
        </div>
        <div>
          <span class="label">Last probe</span>
          <span>${n?.lastProbeAt?T(n.lastProbeAt):"n/a"}</span>
        </div>
      </div>

      ${n?.lastError?o`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:f}

      ${n?.probe?o`<div class="callout" style="margin-top: 12px;">
            Probe ${n.probe.ok?"ok":"failed"} ·
            ${n.probe.error??""}
          </div>`:f}

      ${G({channelId:"imessage",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          Probe
        </button>
      </div>
    </div>
  `}function Fn(e){return e?e.length<=20?e:`${e.slice(0,8)}...${e.slice(-8)}`:"n/a"}function Kr(e){const{props:t,nostr:n,nostrAccounts:i,accountCountLabel:s,profileFormState:a,profileFormCallbacks:l,onEditProfile:r}=e,d=i[0],g=n?.configured??d?.configured??!1,p=n?.running??d?.running??!1,v=n?.publicKey??d?.publicKey,c=n?.lastStartAt??d?.lastStartAt??null,u=n?.lastError??d?.lastError??null,b=i.length>1,w=a!=null,$=k=>{const C=k.publicKey,L=k.profile,I=L?.displayName??L?.name??k.name??k.accountId;return o`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">${I}</div>
          <div class="account-card-id">${k.accountId}</div>
        </div>
        <div class="status-list account-card-status">
          <div>
            <span class="label">Running</span>
            <span>${k.running?"Yes":"No"}</span>
          </div>
          <div>
            <span class="label">Configured</span>
            <span>${k.configured?"Yes":"No"}</span>
          </div>
          <div>
            <span class="label">Public Key</span>
            <span class="monospace" title="${C??""}">${Fn(C)}</span>
          </div>
          <div>
            <span class="label">Last inbound</span>
            <span>${k.lastInboundAt?T(k.lastInboundAt):"n/a"}</span>
          </div>
          ${k.lastError?o`
                <div class="account-card-error">${k.lastError}</div>
              `:f}
        </div>
      </div>
    `},S=()=>{if(w&&l)return Rs({state:a,callbacks:l,accountId:i[0]?.accountId??"default"});const k=d?.profile??n?.profile,{name:C,displayName:L,about:I,picture:x,nip05:_}=k??{},xe=C||L||I||x||_;return o`
      <div style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-weight: 500;">Profile</div>
          ${g?o`
                <button
                  class="btn btn-sm"
                  @click=${r}
                  style="font-size: 12px; padding: 4px 8px;"
                >
                  Edit Profile
                </button>
              `:f}
        </div>
        ${xe?o`
              <div class="status-list">
                ${x?o`
                      <div style="margin-bottom: 8px;">
                        <img
                          src=${x}
                          alt="Profile picture"
                          style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);"
                          @error=${nn=>{nn.target.style.display="none"}}
                        />
                      </div>
                    `:f}
                ${C?o`<div><span class="label">Name</span><span>${C}</span></div>`:f}
                ${L?o`<div><span class="label">Display Name</span><span>${L}</span></div>`:f}
                ${I?o`<div><span class="label">About</span><span style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${I}</span></div>`:f}
                ${_?o`<div><span class="label">NIP-05</span><span>${_}</span></div>`:f}
              </div>
            `:o`
                <div style="color: var(--text-muted); font-size: 13px">
                  No profile set. Click "Edit Profile" to add your name, bio, and avatar.
                </div>
              `}
      </div>
    `};return o`
    <div class="card">
      <div class="card-title">Nostr</div>
      <div class="card-sub">Decentralized DMs via Nostr relays (NIP-04).</div>
      ${s}

      ${b?o`
            <div class="account-card-list">
              ${i.map(k=>$(k))}
            </div>
          `:o`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">Configured</span>
                <span>${g?"Yes":"No"}</span>
              </div>
              <div>
                <span class="label">Running</span>
                <span>${p?"Yes":"No"}</span>
              </div>
              <div>
                <span class="label">Public Key</span>
                <span class="monospace" title="${v??""}"
                  >${Fn(v)}</span
                >
              </div>
              <div>
                <span class="label">Last start</span>
                <span>${c?T(c):"n/a"}</span>
              </div>
            </div>
          `}

      ${u?o`<div class="callout danger" style="margin-top: 12px;">${u}</div>`:f}

      ${S()}

      ${G({channelId:"nostr",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!1)}>Refresh</button>
      </div>
    </div>
  `}function Ur(e){if(!e&&e!==0)return"n/a";const t=Math.round(e/1e3);if(t<60)return`${t}s`;const n=Math.round(t/60);return n<60?`${n}m`:`${Math.round(n/60)}h`}function jr(e,t){const n=t.snapshot,i=n?.channels;if(!n||!i)return!1;const s=i[e],a=typeof s?.configured=="boolean"&&s.configured,l=typeof s?.running=="boolean"&&s.running,r=typeof s?.connected=="boolean"&&s.connected,g=(n.channelAccounts?.[e]??[]).some(p=>p.configured||p.running||p.connected);return a||l||r||g}function Hr(e,t){return t?.[e]?.length??0}function us(e,t){const n=Hr(e,t);return n<2?f:o`<div class="account-count">Accounts (${n})</div>`}function zr(e){const{props:t,signal:n,accountCountLabel:i}=e;return o`
    <div class="card">
      <div class="card-title">Signal</div>
      <div class="card-sub">signal-cli status and channel configuration.</div>
      ${i}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span>${n?.configured?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Running</span>
          <span>${n?.running?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Base URL</span>
          <span>${n?.baseUrl??"n/a"}</span>
        </div>
        <div>
          <span class="label">Last start</span>
          <span>${n?.lastStartAt?T(n.lastStartAt):"n/a"}</span>
        </div>
        <div>
          <span class="label">Last probe</span>
          <span>${n?.lastProbeAt?T(n.lastProbeAt):"n/a"}</span>
        </div>
      </div>

      ${n?.lastError?o`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:f}

      ${n?.probe?o`<div class="callout" style="margin-top: 12px;">
            Probe ${n.probe.ok?"ok":"failed"} ·
            ${n.probe.status??""} ${n.probe.error??""}
          </div>`:f}

      ${G({channelId:"signal",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          Probe
        </button>
      </div>
    </div>
  `}function Vr(e){const{props:t,slack:n,accountCountLabel:i}=e;return o`
    <div class="card">
      <div class="card-title">Slack</div>
      <div class="card-sub">Socket mode status and channel configuration.</div>
      ${i}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span>${n?.configured?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Running</span>
          <span>${n?.running?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Last start</span>
          <span>${n?.lastStartAt?T(n.lastStartAt):"n/a"}</span>
        </div>
        <div>
          <span class="label">Last probe</span>
          <span>${n?.lastProbeAt?T(n.lastProbeAt):"n/a"}</span>
        </div>
      </div>

      ${n?.lastError?o`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:f}

      ${n?.probe?o`<div class="callout" style="margin-top: 12px;">
            Probe ${n.probe.ok?"ok":"failed"} ·
            ${n.probe.status??""} ${n.probe.error??""}
          </div>`:f}

      ${G({channelId:"slack",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          Probe
        </button>
      </div>
    </div>
  `}function qr(e){const{props:t,telegram:n,telegramAccounts:i,accountCountLabel:s}=e,a=i.length>1,l=r=>{const g=r.probe?.bot?.username,p=r.name||r.accountId;return o`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">
            ${g?`@${g}`:p}
          </div>
          <div class="account-card-id">${r.accountId}</div>
        </div>
        <div class="status-list account-card-status">
          <div>
            <span class="label">Running</span>
            <span>${r.running?"Yes":"No"}</span>
          </div>
          <div>
            <span class="label">Configured</span>
            <span>${r.configured?"Yes":"No"}</span>
          </div>
          <div>
            <span class="label">Last inbound</span>
            <span>${r.lastInboundAt?T(r.lastInboundAt):"n/a"}</span>
          </div>
          ${r.lastError?o`
                <div class="account-card-error">
                  ${r.lastError}
                </div>
              `:f}
        </div>
      </div>
    `};return o`
    <div class="card">
      <div class="card-title">Telegram</div>
      <div class="card-sub">Bot status and channel configuration.</div>
      ${s}

      ${a?o`
            <div class="account-card-list">
              ${i.map(r=>l(r))}
            </div>
          `:o`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">Configured</span>
                <span>${n?.configured?"Yes":"No"}</span>
              </div>
              <div>
                <span class="label">Running</span>
                <span>${n?.running?"Yes":"No"}</span>
              </div>
              <div>
                <span class="label">Mode</span>
                <span>${n?.mode??"n/a"}</span>
              </div>
              <div>
                <span class="label">Last start</span>
                <span>${n?.lastStartAt?T(n.lastStartAt):"n/a"}</span>
              </div>
              <div>
                <span class="label">Last probe</span>
                <span>${n?.lastProbeAt?T(n.lastProbeAt):"n/a"}</span>
              </div>
            </div>
          `}

      ${n?.lastError?o`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:f}

      ${n?.probe?o`<div class="callout" style="margin-top: 12px;">
            Probe ${n.probe.ok?"ok":"failed"} ·
            ${n.probe.status??""} ${n.probe.error??""}
          </div>`:f}

      ${G({channelId:"telegram",props:t})}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          Probe
        </button>
      </div>
    </div>
  `}function Gr(e){const{props:t,whatsapp:n,accountCountLabel:i}=e;return o`
    <div class="card">
      <div class="card-title">WhatsApp</div>
      <div class="card-sub">Link WhatsApp Web and monitor connection health.</div>
      ${i}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span>${n?.configured?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Linked</span>
          <span>${n?.linked?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Running</span>
          <span>${n?.running?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Connected</span>
          <span>${n?.connected?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Last connect</span>
          <span>
            ${n?.lastConnectedAt?T(n.lastConnectedAt):"n/a"}
          </span>
        </div>
        <div>
          <span class="label">Last message</span>
          <span>
            ${n?.lastMessageAt?T(n.lastMessageAt):"n/a"}
          </span>
        </div>
        <div>
          <span class="label">Auth age</span>
          <span>
            ${n?.authAgeMs!=null?Ur(n.authAgeMs):"n/a"}
          </span>
        </div>
      </div>

      ${n?.lastError?o`<div class="callout danger" style="margin-top: 12px;">
            ${n.lastError}
          </div>`:f}

      ${t.whatsappMessage?o`<div class="callout" style="margin-top: 12px;">
            ${t.whatsappMessage}
          </div>`:f}

      ${t.whatsappQrDataUrl?o`<div class="qr-wrap">
            <img src=${t.whatsappQrDataUrl} alt="WhatsApp QR" />
          </div>`:f}

      <div class="row" style="margin-top: 14px; flex-wrap: wrap;">
        <button
          class="btn primary"
          ?disabled=${t.whatsappBusy}
          @click=${()=>t.onWhatsAppStart(!1)}
        >
          ${t.whatsappBusy?"Working…":"Show QR"}
        </button>
        <button
          class="btn"
          ?disabled=${t.whatsappBusy}
          @click=${()=>t.onWhatsAppStart(!0)}
        >
          Relink
        </button>
        <button
          class="btn"
          ?disabled=${t.whatsappBusy}
          @click=${()=>t.onWhatsAppWait()}
        >
          Wait for scan
        </button>
        <button
          class="btn danger"
          ?disabled=${t.whatsappBusy}
          @click=${()=>t.onWhatsAppLogout()}
        >
          Logout
        </button>
        <button class="btn" @click=${()=>t.onRefresh(!0)}>
          Refresh
        </button>
      </div>

      ${G({channelId:"whatsapp",props:t})}
    </div>
  `}function Wr(e){const t=e.snapshot?.channels,n=t?.whatsapp??void 0,i=t?.telegram??void 0,s=t?.discord??null;t?.googlechat;const a=t?.slack??null,l=t?.signal??null,r=t?.imessage??null,d=t?.nostr??null,p=Yr(e.snapshot).map((v,c)=>({key:v,enabled:jr(v,e),order:c})).toSorted((v,c)=>v.enabled!==c.enabled?v.enabled?-1:1:v.order-c.order);return o`
    <section class="grid grid-cols-2">
      ${p.map(v=>Qr(v.key,e,{whatsapp:n,telegram:i,discord:s,slack:a,signal:l,imessage:r,nostr:d,channelAccounts:e.snapshot?.channelAccounts??null}))}
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Channel health</div>
          <div class="card-sub">Channel status snapshots from the gateway.</div>
        </div>
        <div class="muted">${e.lastSuccessAt?T(e.lastSuccessAt):"n/a"}</div>
      </div>
      ${e.lastError?o`<div class="callout danger" style="margin-top: 12px;">
            ${e.lastError}
          </div>`:f}
      <pre class="code-block" style="margin-top: 12px;">
${e.snapshot?JSON.stringify(e.snapshot,null,2):"No snapshot yet."}
      </pre>
    </section>
  `}function Yr(e){return e?.channelMeta?.length?e.channelMeta.map(t=>t.id):e?.channelOrder?.length?e.channelOrder:["whatsapp","telegram","discord","googlechat","slack","signal","imessage","nostr"]}function Qr(e,t,n){const i=us(e,n.channelAccounts);switch(e){case"whatsapp":return Gr({props:t,whatsapp:n.whatsapp,accountCountLabel:i});case"telegram":return qr({props:t,telegram:n.telegram,telegramAccounts:n.channelAccounts?.telegram??[],accountCountLabel:i});case"discord":return Br({props:t,discord:n.discord,accountCountLabel:i});case"googlechat":return Dr({props:t,accountCountLabel:i});case"slack":return Vr({props:t,slack:n.slack,accountCountLabel:i});case"signal":return zr({props:t,signal:n.signal,accountCountLabel:i});case"imessage":return Or({props:t,imessage:n.imessage,accountCountLabel:i});case"nostr":{const s=n.channelAccounts?.nostr??[],a=s[0],l=a?.accountId??"default",r=a?.profile??null,d=t.nostrProfileAccountId===l?t.nostrProfileFormState:null,g=d?{onFieldChange:t.onNostrProfileFieldChange,onSave:t.onNostrProfileSave,onImport:t.onNostrProfileImport,onCancel:t.onNostrProfileCancel,onToggleAdvanced:t.onNostrProfileToggleAdvanced}:null;return Kr({props:t,nostr:n.nostr,nostrAccounts:s,accountCountLabel:i,profileFormState:d,profileFormCallbacks:g,onEditProfile:()=>t.onNostrProfileEdit(l,r)})}default:return Jr(e,t,n.channelAccounts??{})}}function Jr(e,t,n){const i=Zr(t.snapshot,e),s=t.snapshot?.channels?.[e],a=typeof s?.configured=="boolean"?s.configured:void 0,l=typeof s?.running=="boolean"?s.running:void 0,r=typeof s?.connected=="boolean"?s.connected:void 0,d=typeof s?.lastError=="string"?s.lastError:void 0,g=n[e]??[],p=us(e,n);return o`
    <div class="card">
      <div class="card-title">${i}</div>
      <div class="card-sub">Channel status and configuration.</div>
      ${p}

      ${g.length>0?o`
            <div class="account-card-list">
              ${g.map(v=>ic(v))}
            </div>
          `:o`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">Configured</span>
                <span>${a==null?"n/a":a?"Yes":"No"}</span>
              </div>
              <div>
                <span class="label">Running</span>
                <span>${l==null?"n/a":l?"Yes":"No"}</span>
              </div>
              <div>
                <span class="label">Connected</span>
                <span>${r==null?"n/a":r?"Yes":"No"}</span>
              </div>
            </div>
          `}

      ${d?o`<div class="callout danger" style="margin-top: 12px;">
            ${d}
          </div>`:f}

      ${G({channelId:e,props:t})}
    </div>
  `}function Xr(e){return e?.channelMeta?.length?Object.fromEntries(e.channelMeta.map(t=>[t.id,t])):{}}function Zr(e,t){return Xr(e)[t]?.label??e?.channelLabels?.[t]??t}const ec=600*1e3;function gs(e){return e.lastInboundAt?Date.now()-e.lastInboundAt<ec:!1}function tc(e){return e.running?"Yes":gs(e)?"Active":"No"}function nc(e){return e.connected===!0?"Yes":e.connected===!1?"No":gs(e)?"Active":"n/a"}function ic(e){const t=tc(e),n=nc(e);return o`
    <div class="account-card">
      <div class="account-card-header">
        <div class="account-card-title">${e.name||e.accountId}</div>
        <div class="account-card-id">${e.accountId}</div>
      </div>
      <div class="status-list account-card-status">
        <div>
          <span class="label">Running</span>
          <span>${t}</span>
        </div>
        <div>
          <span class="label">Configured</span>
          <span>${e.configured?"Yes":"No"}</span>
        </div>
        <div>
          <span class="label">Connected</span>
          <span>${n}</span>
        </div>
        <div>
          <span class="label">Last inbound</span>
          <span>${e.lastInboundAt?T(e.lastInboundAt):"n/a"}</span>
        </div>
        ${e.lastError?o`
              <div class="account-card-error">
                ${e.lastError}
              </div>
            `:f}
      </div>
    </div>
  `}class Et extends ei{constructor(t){if(super(t),this.it=f,t.type!==ti.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===f||t==null)return this._t=void 0,this.it=t;if(t===ks)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const n=[t];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}}Et.directiveName="unsafeHTML",Et.resultType=1;const Mt=ni(Et);si.setOptions({gfm:!0,breaks:!0,mangle:!1});const Rn=["a","b","blockquote","br","code","del","em","h1","h2","h3","h4","hr","i","li","ol","p","pre","strong","table","tbody","td","th","thead","tr","ul"],Pn=["class","href","rel","target","title","start"];let Nn=!1;const sc=14e4,ac=4e4,oc=200,gt=5e4,ee=new Map;function lc(e){const t=ee.get(e);return t===void 0?null:(ee.delete(e),ee.set(e,t),t)}function Bn(e,t){if(ee.set(e,t),ee.size<=oc)return;const n=ee.keys().next().value;n&&ee.delete(n)}function rc(){Nn||(Nn=!0,pt.addHook("afterSanitizeAttributes",e=>{!(e instanceof HTMLAnchorElement)||!e.getAttribute("href")||(e.setAttribute("rel","noreferrer noopener"),e.setAttribute("target","_blank"))}))}function Ft(e){const t=e.trim();if(!t)return"";if(rc(),t.length<=gt){const l=lc(t);if(l!==null)return l}const n=pi(t,sc),i=n.truncated?`

… truncated (${n.total} chars, showing first ${n.text.length}).`:"";if(n.text.length>ac){const r=`<pre class="code-block">${cc(`${n.text}${i}`)}</pre>`,d=pt.sanitize(r,{ALLOWED_TAGS:Rn,ALLOWED_ATTR:Pn});return t.length<=gt&&Bn(t,d),d}const s=si.parse(`${n.text}${i}`),a=pt.sanitize(s,{ALLOWED_TAGS:Rn,ALLOWED_ATTR:Pn});return t.length<=gt&&Bn(t,a),a}function cc(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}const dc=1500,uc=2e3,fs="Copy as markdown",gc="Copied",fc="Copy failed";async function vc(e){if(!e)return!1;try{return await navigator.clipboard.writeText(e),!0}catch{return!1}}function _e(e,t){e.title=t,e.setAttribute("aria-label",t)}function pc(e){const t=e.label??fs;return o`
    <button
      class="chat-copy-btn"
      type="button"
      title=${t}
      aria-label=${t}
      @click=${async n=>{const i=n.currentTarget;if(!i||i.dataset.copying==="1")return;i.dataset.copying="1",i.setAttribute("aria-busy","true"),i.disabled=!0;const s=await vc(e.text());if(i.isConnected){if(delete i.dataset.copying,i.removeAttribute("aria-busy"),i.disabled=!1,!s){i.dataset.error="1",_e(i,fc),window.setTimeout(()=>{i.isConnected&&(delete i.dataset.error,_e(i,t))},uc);return}i.dataset.copied="1",_e(i,gc),window.setTimeout(()=>{i.isConnected&&(delete i.dataset.copied,_e(i,t))},dc)}}}
    >
      <span class="chat-copy-btn__icon" aria-hidden="true">
        <span class="chat-copy-btn__icon-copy">${M.copy}</span>
        <span class="chat-copy-btn__icon-check">${M.check}</span>
      </span>
    </button>
  `}function hc(e){return pc({text:()=>e,label:fs})}async function mc(e){if(!e)return!1;try{return await navigator.clipboard.writeText(e),!0}catch{return!1}}const yc='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>';function Dn(e){e.querySelectorAll("pre").forEach(n=>{if(n.querySelector(".code-block-copy-btn"))return;const s=n.querySelector("code")?.textContent||n.textContent||"";if(!s.trim())return;const a=document.createElement("button");a.className="code-block-copy-btn",a.type="button",a.setAttribute("aria-label","Copy code"),a.title="Copy code",a.innerHTML=`<span class="code-block-copy-btn__icon" aria-hidden="true">${yc}</span>`;let l=null;a.addEventListener("click",async()=>{if(a.dataset.copying==="1")return;a.dataset.copying="1",a.disabled=!0,a.setAttribute("aria-busy","true");const r=await mc(s);a.isConnected&&(a.dataset.copying="",a.disabled=!1,a.removeAttribute("aria-busy"),r?(a.dataset.copied="1",a.setAttribute("aria-label","Copied!"),a.title="Copied!",l!==null&&window.clearTimeout(l),l=window.setTimeout(()=>{a.isConnected&&(a.dataset.copied="",a.setAttribute("aria-label","Copy code"),a.title="Copy code")},2e3)):(a.dataset.error="1",a.setAttribute("aria-label","Copy failed"),a.title="Copy failed",l!==null&&window.clearTimeout(l),l=window.setTimeout(()=>{a.isConnected&&(a.dataset.error="",a.setAttribute("aria-label","Copy code"),a.title="Copy code")},2e3)))}),n.style.position="relative",n.appendChild(a)})}function vs(e){const t=e;let n=typeof t.role=="string"?t.role:"unknown";const i=typeof t.toolCallId=="string"||typeof t.tool_call_id=="string",s=t.content,a=Array.isArray(s)?s:null,l=Array.isArray(a)&&a.some(v=>{const c=v,u=(typeof c.type=="string"?c.type:"").toLowerCase();return u==="toolresult"||u==="tool_result"}),r=typeof t.toolName=="string"||typeof t.tool_name=="string";(i||l||r)&&(n="toolResult");let d=[];typeof t.content=="string"?d=[{type:"text",text:t.content}]:Array.isArray(t.content)?d=t.content.map(v=>({type:v.type||"text",text:v.text,name:v.name,args:v.args||v.arguments})):typeof t.text=="string"&&(d=[{type:"text",text:t.text}]);const g=typeof t.timestamp=="number"?t.timestamp:Date.now(),p=typeof t.id=="string"?t.id:void 0;return{role:n,content:d,timestamp:g,id:p}}function en(e){const t=e.toLowerCase();return e==="user"||e==="User"?e:e==="assistant"?"assistant":e==="system"?"system":t==="toolresult"||t==="tool_result"||t==="tool"||t==="function"?"tool":e}function ps(e){const t=e,n=typeof t.role=="string"?t.role.toLowerCase():"";return n==="toolresult"||n==="tool_result"}const bc={icon:"puzzle",detailKeys:["command","path","url","targetUrl","targetId","ref","element","node","nodeId","id","requestId","to","channelId","guildId","userId","name","query","pattern","messageId"]},wc={bash:{icon:"wrench",title:"Bash",detailKeys:["command"]},process:{icon:"wrench",title:"Process",detailKeys:["sessionId"]},read:{icon:"fileText",title:"Read",detailKeys:["path"]},write:{icon:"edit",title:"Write",detailKeys:["path"]},edit:{icon:"penLine",title:"Edit",detailKeys:["path"]},attach:{icon:"paperclip",title:"Attach",detailKeys:["path","url","fileName"]},browser:{icon:"globe",title:"Browser",actions:{status:{label:"status"},start:{label:"start"},stop:{label:"stop"},tabs:{label:"tabs"},open:{label:"open",detailKeys:["targetUrl"]},focus:{label:"focus",detailKeys:["targetId"]},close:{label:"close",detailKeys:["targetId"]},snapshot:{label:"snapshot",detailKeys:["targetUrl","targetId","ref","element","format"]},screenshot:{label:"screenshot",detailKeys:["targetUrl","targetId","ref","element"]},navigate:{label:"navigate",detailKeys:["targetUrl","targetId"]},console:{label:"console",detailKeys:["level","targetId"]},pdf:{label:"pdf",detailKeys:["targetId"]},upload:{label:"upload",detailKeys:["paths","ref","inputRef","element","targetId"]},dialog:{label:"dialog",detailKeys:["accept","promptText","targetId"]},act:{label:"act",detailKeys:["request.kind","request.ref","request.selector","request.text","request.value"]}}},canvas:{icon:"image",title:"Canvas",actions:{present:{label:"present",detailKeys:["target","node","nodeId"]},hide:{label:"hide",detailKeys:["node","nodeId"]},navigate:{label:"navigate",detailKeys:["url","node","nodeId"]},eval:{label:"eval",detailKeys:["javaScript","node","nodeId"]},snapshot:{label:"snapshot",detailKeys:["format","node","nodeId"]},a2ui_push:{label:"A2UI push",detailKeys:["jsonlPath","node","nodeId"]},a2ui_reset:{label:"A2UI reset",detailKeys:["node","nodeId"]}}},nodes:{icon:"smartphone",title:"Nodes",actions:{status:{label:"status"},describe:{label:"describe",detailKeys:["node","nodeId"]},pending:{label:"pending"},approve:{label:"approve",detailKeys:["requestId"]},reject:{label:"reject",detailKeys:["requestId"]},notify:{label:"notify",detailKeys:["node","nodeId","title","body"]},camera_snap:{label:"camera snap",detailKeys:["node","nodeId","facing","deviceId"]},camera_list:{label:"camera list",detailKeys:["node","nodeId"]},camera_clip:{label:"camera clip",detailKeys:["node","nodeId","facing","duration","durationMs"]},screen_record:{label:"screen record",detailKeys:["node","nodeId","duration","durationMs","fps","screenIndex"]}}},cron:{icon:"loader",title:"Cron",actions:{status:{label:"status"},list:{label:"list"},add:{label:"add",detailKeys:["job.name","job.id","job.schedule","job.cron"]},update:{label:"update",detailKeys:["id"]},remove:{label:"remove",detailKeys:["id"]},run:{label:"run",detailKeys:["id"]},runs:{label:"runs",detailKeys:["id"]},wake:{label:"wake",detailKeys:["text","mode"]}}},gateway:{icon:"plug",title:"Gateway",actions:{restart:{label:"restart",detailKeys:["reason","delayMs"]},"config.get":{label:"config get"},"config.schema":{label:"config schema"},"config.apply":{label:"config apply",detailKeys:["restartDelayMs"]},"update.run":{label:"update run",detailKeys:["restartDelayMs"]}}},whatsapp_login:{icon:"circle",title:"WhatsApp Login",actions:{start:{label:"start"},wait:{label:"wait"}}},discord:{icon:"messageSquare",title:"Discord",actions:{react:{label:"react",detailKeys:["channelId","messageId","emoji"]},reactions:{label:"reactions",detailKeys:["channelId","messageId"]},sticker:{label:"sticker",detailKeys:["to","stickerIds"]},poll:{label:"poll",detailKeys:["question","to"]},permissions:{label:"permissions",detailKeys:["channelId"]},readMessages:{label:"read messages",detailKeys:["channelId","limit"]},sendMessage:{label:"send",detailKeys:["to","content"]},editMessage:{label:"edit",detailKeys:["channelId","messageId"]},deleteMessage:{label:"delete",detailKeys:["channelId","messageId"]},threadCreate:{label:"thread create",detailKeys:["channelId","name"]},threadList:{label:"thread list",detailKeys:["guildId","channelId"]},threadReply:{label:"thread reply",detailKeys:["channelId","content"]},pinMessage:{label:"pin",detailKeys:["channelId","messageId"]},unpinMessage:{label:"unpin",detailKeys:["channelId","messageId"]},listPins:{label:"list pins",detailKeys:["channelId"]},searchMessages:{label:"search",detailKeys:["guildId","content"]},memberInfo:{label:"member",detailKeys:["guildId","userId"]},roleInfo:{label:"roles",detailKeys:["guildId"]},emojiList:{label:"emoji list",detailKeys:["guildId"]},roleAdd:{label:"role add",detailKeys:["guildId","userId","roleId"]},roleRemove:{label:"role remove",detailKeys:["guildId","userId","roleId"]},channelInfo:{label:"channel",detailKeys:["channelId"]},channelList:{label:"channels",detailKeys:["guildId"]},voiceStatus:{label:"voice",detailKeys:["guildId","userId"]},eventList:{label:"events",detailKeys:["guildId"]},eventCreate:{label:"event create",detailKeys:["guildId","name"]},timeout:{label:"timeout",detailKeys:["guildId","userId"]},kick:{label:"kick",detailKeys:["guildId","userId"]},ban:{label:"ban",detailKeys:["guildId","userId"]}}},slack:{icon:"messageSquare",title:"Slack",actions:{react:{label:"react",detailKeys:["channelId","messageId","emoji"]},reactions:{label:"reactions",detailKeys:["channelId","messageId"]},sendMessage:{label:"send",detailKeys:["to","content"]},editMessage:{label:"edit",detailKeys:["channelId","messageId"]},deleteMessage:{label:"delete",detailKeys:["channelId","messageId"]},readMessages:{label:"read messages",detailKeys:["channelId","limit"]},pinMessage:{label:"pin",detailKeys:["channelId","messageId"]},unpinMessage:{label:"unpin",detailKeys:["channelId","messageId"]},listPins:{label:"list pins",detailKeys:["channelId"]},memberInfo:{label:"member",detailKeys:["userId"]},emojiList:{label:"emoji list"}}}},$c={fallback:bc,tools:wc},hs=$c,On=hs.fallback??{icon:"puzzle"},Sc=hs.tools??{};function kc(e){return(e??"tool").trim()}function xc(e){const t=e.replace(/_/g," ").trim();return t?t.split(/\s+/).map(n=>n.length<=2&&n.toUpperCase()===n?n:`${n.at(0)?.toUpperCase()??""}${n.slice(1)}`).join(" "):"Tool"}function Ac(e){const t=e?.trim();if(t)return t.replace(/_/g," ")}function ms(e){if(e!=null){if(typeof e=="string"){const t=e.trim();if(!t)return;const n=t.split(/\r?\n/)[0]?.trim()??"";return n?n.length>160?`${n.slice(0,157)}…`:n:void 0}if(typeof e=="number"||typeof e=="boolean")return String(e);if(Array.isArray(e)){const t=e.map(i=>ms(i)).filter(i=>!!i);if(t.length===0)return;const n=t.slice(0,3).join(", ");return t.length>3?`${n}…`:n}}}function Cc(e,t){if(!e||typeof e!="object")return;let n=e;for(const i of t.split(".")){if(!i||!n||typeof n!="object")return;n=n[i]}return n}function Ic(e,t){for(const n of t){const i=Cc(e,n),s=ms(i);if(s)return s}}function Lc(e){if(!e||typeof e!="object")return;const t=e,n=typeof t.path=="string"?t.path:void 0;if(!n)return;const i=typeof t.offset=="number"?t.offset:void 0,s=typeof t.limit=="number"?t.limit:void 0;return i!==void 0&&s!==void 0?`${n}:${i}-${i+s}`:n}function _c(e){if(!e||typeof e!="object")return;const t=e;return typeof t.path=="string"?t.path:void 0}function Tc(e,t){if(!(!e||!t))return e.actions?.[t]??void 0}function Ec(e){const t=kc(e.name),n=t.toLowerCase(),i=Sc[n],s=i?.icon??On.icon??"puzzle",a=i?.title??xc(t),l=i?.label??t,r=e.args&&typeof e.args=="object"?e.args.action:void 0,d=typeof r=="string"?r.trim():void 0,g=Tc(i,d),p=Ac(g?.label??d);let v;n==="read"&&(v=Lc(e.args)),!v&&(n==="write"||n==="edit"||n==="attach")&&(v=_c(e.args));const c=g?.detailKeys??i?.detailKeys??On.detailKeys??[];return!v&&c.length>0&&(v=Ic(e.args,c)),!v&&e.meta&&(v=e.meta),v&&(v=Fc(v)),{name:t,icon:s,title:a,label:l,verb:p,detail:v}}function Mc(e){const t=[];if(e.verb&&t.push(e.verb),e.detail&&t.push(e.detail),t.length!==0)return t.join(" · ")}function Fc(e){return e&&e.replace(/\/Users\/[^/]+/g,"~").replace(/\/home\/[^/]+/g,"~")}const Rc=80,Pc=2,Kn=100;function Nc(e){const t=e.trim();if(t.startsWith("{")||t.startsWith("["))try{const n=JSON.parse(t);return"```json\n"+JSON.stringify(n,null,2)+"\n```"}catch{}return e}function Bc(e){const t=e.split(`
`),n=t.slice(0,Pc),i=n.join(`
`);return i.length>Kn?i.slice(0,Kn)+"…":n.length<t.length?i+"…":i}function Dc(e){const t=e,n=Oc(t.content),i=[];for(const s of n){const a=(typeof s.type=="string"?s.type:"").toLowerCase();(["toolcall","tool_call","tooluse","tool_use"].includes(a)||typeof s.name=="string"&&s.arguments!=null)&&i.push({kind:"call",name:s.name??"tool",args:Kc(s.arguments??s.args)})}for(const s of n){const a=(typeof s.type=="string"?s.type:"").toLowerCase();if(a!=="toolresult"&&a!=="tool_result")continue;const l=Uc(s),r=typeof s.name=="string"?s.name:"tool";i.push({kind:"result",name:r,text:l})}if(ps(e)&&!i.some(s=>s.kind==="result")){const s=typeof t.toolName=="string"&&t.toolName||typeof t.tool_name=="string"&&t.tool_name||"tool",a=Hi(e)??void 0;i.push({kind:"result",name:s,text:a})}return i}function Un(e,t){const n=Ec({name:e.name,args:e.args}),i=Mc(n),s=!!e.text?.trim(),a=!!t,l=a?()=>{if(s){t(Nc(e.text));return}const v=`## ${n.label}

${i?`**Command:** \`${i}\`

`:""}*No output — tool completed successfully.*`;t(v)}:void 0,r=s&&(e.text?.length??0)<=Rc,d=s&&!r,g=s&&r,p=!s;return o`
    <div
      class="chat-tool-card ${a?"chat-tool-card--clickable":""}"
      @click=${l}
      role=${a?"button":f}
      tabindex=${a?"0":f}
      @keydown=${a?v=>{v.key!=="Enter"&&v.key!==" "||(v.preventDefault(),l?.())}:f}
    >
      <div class="chat-tool-card__header">
        <div class="chat-tool-card__title">
          <span class="chat-tool-card__icon">${M[n.icon]}</span>
          <span>${n.label}</span>
        </div>
        ${a?o`<span class="chat-tool-card__action">${s?"View":""} ${M.check}</span>`:f}
        ${p&&!a?o`<span class="chat-tool-card__status">${M.check}</span>`:f}
      </div>
      ${i?o`<div class="chat-tool-card__detail">${i}</div>`:f}
      ${p?o`
              <div class="chat-tool-card__status-text muted">Completed</div>
            `:f}
      ${d?o`<div class="chat-tool-card__preview mono">${Bc(e.text)}</div>`:f}
      ${g?o`<div class="chat-tool-card__inline mono">${e.text}</div>`:f}
    </div>
  `}function Oc(e){return Array.isArray(e)?e.filter(Boolean):[]}function Kc(e){if(typeof e!="string")return e;const t=e.trim();if(!t||!t.startsWith("{")&&!t.startsWith("["))return e;try{return JSON.parse(t)}catch{return e}}function Uc(e){if(typeof e.text=="string")return e.text;if(typeof e.content=="string")return e.content}function jc(e){const n=e.content,i=[];if(Array.isArray(n))for(const s of n){if(typeof s!="object"||s===null)continue;const a=s;if(a.type==="image"){const l=a.source;if(l?.type==="base64"&&typeof l.data=="string"){const r=l.data,d=l.media_type||"image/png",g=r.startsWith("data:")?r:`data:${d};base64,${r}`;i.push({url:g})}else typeof a.url=="string"&&i.push({url:a.url})}else if(a.type==="image_url"){const l=a.image_url;typeof l?.url=="string"&&i.push({url:l.url})}}return i}function Hc(e){return o`
    <div class="chat-group assistant">
      ${tn("assistant",e)}
      <div class="chat-group-messages">
        <div class="chat-bubble chat-reading-indicator" aria-hidden="true">
          <span class="chat-reading-indicator__dots">
            <span></span><span></span><span></span>
          </span>
        </div>
      </div>
    </div>
  `}function zc(e,t,n,i){const s=new Date(t).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}),a=i?.name??"Assistant";return o`
    <div class="chat-group assistant">
      ${tn("assistant",i)}
      <div class="chat-group-messages">
        ${ys({role:"assistant",content:[{type:"text",text:e}],timestamp:t},{isStreaming:!0,showReasoning:!1},n)}
        <div class="chat-group-footer">
          <span class="chat-sender-name">${a}</span>
          <span class="chat-group-timestamp">${s}</span>
        </div>
      </div>
    </div>
  `}function Vc(e,t){const n=en(e.role),i=t.assistantName??"Assistant",s=n==="user"?"You":n==="assistant"?i:n,a=n==="user"?"user":n==="assistant"?"assistant":"other",l=new Date(e.timestamp).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});return o`
    <div class="chat-group ${a}">
      ${tn(e.role,{name:i,avatar:t.assistantAvatar??null})}
      <div class="chat-group-messages">
        ${e.messages.map((r,d)=>ys(r.message,{isStreaming:e.isStreaming&&d===e.messages.length-1,showReasoning:t.showReasoning},t.onOpenSidebar))}
        <div class="chat-group-footer">
          <span class="chat-sender-name">${s}</span>
          <span class="chat-group-timestamp">${l}</span>
        </div>
      </div>
    </div>
  `}function tn(e,t){const n=en(e),i=t?.name?.trim()||"Assistant",s=t?.avatar?.trim()||"",a=n==="user"?"U":n==="assistant"?i.charAt(0).toUpperCase()||"A":n==="tool"?"⚙":"?",l=n==="user"?"user":n==="assistant"?"assistant":n==="tool"?"tool":"other";return s&&n==="assistant"?qc(s)?o`<img
        class="chat-avatar ${l}"
        src="${s}"
        alt="${i}"
      />`:o`<div class="chat-avatar ${l}">${s}</div>`:o`<div class="chat-avatar ${l}">${a}</div>`}function qc(e){return/^https?:\/\//i.test(e)||/^data:image\//i.test(e)||e.startsWith("/")}function Gc(e){return e.length===0?f:o`
    <div class="chat-message-images">
      ${e.map(t=>o`
          <img
            src=${t.url}
            alt=${t.alt??"Attached image"}
            class="chat-message-image"
            @click=${()=>window.open(t.url,"_blank")}
          />
        `)}
    </div>
  `}function ys(e,t,n){const i=e,s=typeof i.role=="string"?i.role:"unknown",a=ps(e)||s.toLowerCase()==="toolresult"||s.toLowerCase()==="tool_result"||typeof i.toolCallId=="string"||typeof i.tool_call_id=="string",l=Dc(e),r=l.length>0,d=jc(e),g=d.length>0,p=Hi(e),v=t.showReasoning&&s==="assistant"?Bo(e):null,c=p?.trim()?p:null,u=v?Oo(v):null,b=c,w=s==="assistant"&&!!b?.trim(),$=["chat-bubble",w?"has-copy":"",t.isStreaming?"streaming":"","fade-in"].filter(Boolean).join(" ");return!b&&r&&a?o`${l.map(S=>Un(S,n))}`:!b&&!r&&!g?f:o`
    <div class="${$}">
      ${w?hc(b):f}
      ${Gc(d)}
      ${u?o`<div class="chat-thinking" ${Oe(S=>{S&&requestAnimationFrame(()=>{Dn(S)})})}>${Mt(Ft(u))}</div>`:f}
      ${b?o`<div class="chat-text" ${Oe(S=>{S&&requestAnimationFrame(()=>{Dn(S)})})}>${Mt(Ft(b))}</div>`:f}
      ${l.map(S=>Un(S,n))}
    </div>
  `}function Wc(e){return o`
    <div class="sidebar-panel">
      <div class="sidebar-header">
        <div class="sidebar-title">Tool Output</div>
        <button @click=${e.onClose} class="btn" title="Close sidebar">
          ${M.x}
        </button>
      </div>
      <div class="sidebar-content">
        ${e.error?o`
              <div class="callout danger">${e.error}</div>
              <button @click=${e.onViewRawText} class="btn" style="margin-top: 12px;">
                View Raw Text
              </button>
            `:e.content?o`<div class="sidebar-markdown">${Mt(Ft(e.content))}</div>`:o`
                  <div class="muted">No content available</div>
                `}
      </div>
    </div>
  `}var Yc=Object.defineProperty,Qc=Object.getOwnPropertyDescriptor,Je=(e,t,n,i)=>{for(var s=i>1?void 0:i?Qc(t,n):t,a=e.length-1,l;a>=0;a--)(l=e[a])&&(s=(i?l(t,n,s):l(s))||s);return i&&s&&Yc(t,n,s),s};let re=class extends Xn{constructor(){super(...arguments),this.splitRatio=.6,this.minRatio=.4,this.maxRatio=.7,this.isDragging=!1,this.startX=0,this.startRatio=0,this.handleMouseDown=e=>{this.isDragging=!0,this.startX=e.clientX,this.startRatio=this.splitRatio,this.classList.add("dragging"),document.addEventListener("mousemove",this.handleMouseMove),document.addEventListener("mouseup",this.handleMouseUp),e.preventDefault()},this.handleMouseMove=e=>{if(!this.isDragging)return;const t=this.parentElement;if(!t)return;const n=t.getBoundingClientRect().width,s=(e.clientX-this.startX)/n;let a=this.startRatio+s;a=Math.max(this.minRatio,Math.min(this.maxRatio,a)),this.dispatchEvent(new CustomEvent("resize",{detail:{splitRatio:a},bubbles:!0,composed:!0}))},this.handleMouseUp=()=>{this.isDragging=!1,this.classList.remove("dragging"),document.removeEventListener("mousemove",this.handleMouseMove),document.removeEventListener("mouseup",this.handleMouseUp)}}render(){return f}connectedCallback(){super.connectedCallback(),this.addEventListener("mousedown",this.handleMouseDown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("mousedown",this.handleMouseDown),document.removeEventListener("mousemove",this.handleMouseMove),document.removeEventListener("mouseup",this.handleMouseUp)}};re.styles=xs`
    :host {
      width: 4px;
      cursor: col-resize;
      background: var(--border, #333);
      transition: background 150ms ease-out;
      flex-shrink: 0;
      position: relative;
    }
    :host::before {
      content: "";
      position: absolute;
      top: 0;
      left: -4px;
      right: -4px;
      bottom: 0;
    }
    :host(:hover) {
      background: var(--accent, #007bff);
    }
    :host(.dragging) {
      background: var(--accent, #007bff);
    }
  `;Je([Pt({type:Number})],re.prototype,"splitRatio",2);Je([Pt({type:Number})],re.prototype,"minRatio",2);Je([Pt({type:Number})],re.prototype,"maxRatio",2);re=Je([Zn("resizable-divider")],re);const Jc=5e3;function jn(e){e.style.height="auto",e.style.height=`${e.scrollHeight}px`}function Xc(e){return e?e.active?o`
      <div class="callout info compaction-indicator compaction-indicator--active">
        ${M.loader} Compacting context...
      </div>
    `:e.completedAt&&Date.now()-e.completedAt<Jc?o`
        <div class="callout success compaction-indicator compaction-indicator--complete">
          ${M.check} Context compacted
        </div>
      `:f:f}function Zc(){return`att-${Date.now()}-${Math.random().toString(36).slice(2,9)}`}function ed(e,t){const n=e.clipboardData?.items;if(!n||!t.onAttachmentsChange)return;const i=[];for(let s=0;s<n.length;s++){const a=n[s];a.type.startsWith("image/")&&i.push(a)}if(i.length!==0){e.preventDefault();for(const s of i){const a=s.getAsFile();if(!a)continue;const l=new FileReader;l.addEventListener("load",()=>{const r=l.result,d={id:Zc(),dataUrl:r,mimeType:a.type},g=t.attachments??[];t.onAttachmentsChange?.([...g,d])}),l.readAsDataURL(a)}}}function td(e){const t=e.attachments??[];return t.length===0?f:o`
    <div class="chat-attachments">
      ${t.map(n=>o`
          <div class="chat-attachment">
            <img
              src=${n.dataUrl}
              alt="Attachment preview"
              class="chat-attachment__img"
            />
            <button
              class="chat-attachment__remove"
              type="button"
              aria-label="Remove attachment"
              @click=${()=>{const i=(e.attachments??[]).filter(s=>s.id!==n.id);e.onAttachmentsChange?.(i)}}
            >
              ${M.x}
            </button>
          </div>
        `)}
    </div>
  `}function nd(e){const t=e.connected,n=e.sending||e.stream!==null,i=!!(e.canAbort&&e.onAbort),a=e.sessions?.sessions?.find(u=>u.key===e.sessionKey)?.reasoningLevel??"off",l=e.showThinking&&a!=="off",r={name:e.assistantName,avatar:e.assistantAvatar??e.assistantAvatarUrl??null},d=(e.attachments?.length??0)>0,g=e.connected?d?"Add a message or paste more images...":"Message (↩ to send, Shift+↩ for line breaks, paste images)":"Connect to the gateway to start chatting…",p=e.splitRatio??.6,v=!!(e.sidebarOpen&&e.onCloseSidebar),c=o`
    <div
      class="chat-thread"
      role="log"
      aria-live="polite"
      @scroll=${e.onChatScroll}
    >
      ${e.loading?o`
              <div class="muted">Loading chat…</div>
            `:f}
      ${ii(sd(e),u=>u.key,u=>u.kind==="reading-indicator"?Hc(r):u.kind==="stream"?zc(u.text,u.startedAt,e.onOpenSidebar,r):u.kind==="group"?Vc(u,{onOpenSidebar:e.onOpenSidebar,showReasoning:l,assistantName:e.assistantName,assistantAvatar:r.avatar}):f)}
    </div>
  `;return o`
    <section class="card chat">
      ${e.disabledReason?o`<div class="callout">${e.disabledReason}</div>`:f}

      ${e.error?o`<div class="callout danger">${e.error}</div>`:f}

      ${Xc(e.compactionStatus)}

      ${e.focusMode?o`
            <button
              class="chat-focus-exit"
              type="button"
              @click=${e.onToggleFocusMode}
              aria-label="Exit focus mode"
              title="Exit focus mode"
            >
              ${M.x}
            </button>
          `:f}

      <div
        class="chat-split-container ${v?"chat-split-container--open":""}"
      >
        <div
          class="chat-main"
          style="flex: ${v?`0 0 ${p*100}%`:"1 1 100%"}"
        >
          ${c}
        </div>

        ${v?o`
              <resizable-divider
                .splitRatio=${p}
                @resize=${u=>e.onSplitRatioChange?.(u.detail.splitRatio)}
              ></resizable-divider>
              <div class="chat-sidebar">
                ${Wc({content:e.sidebarContent??null,error:e.sidebarError??null,onClose:e.onCloseSidebar,onViewRawText:()=>{!e.sidebarContent||!e.onOpenSidebar||e.onOpenSidebar(`\`\`\`
${e.sidebarContent}
\`\`\``)}})}
              </div>
            `:f}
      </div>

      ${e.queue.length?o`
            <div class="chat-queue" role="status" aria-live="polite">
              <div class="chat-queue__title">Queued (${e.queue.length})</div>
              <div class="chat-queue__list">
                ${e.queue.map(u=>o`
                    <div class="chat-queue__item">
                      <div class="chat-queue__text">
                        ${u.text||(u.attachments?.length?`Image (${u.attachments.length})`:"")}
                      </div>
                      <button
                        class="btn chat-queue__remove"
                        type="button"
                        aria-label="Remove queued message"
                        @click=${()=>e.onQueueRemove(u.id)}
                      >
                        ${M.x}
                      </button>
                    </div>
                  `)}
              </div>
            </div>
          `:f}

      ${e.showNewMessages?o`
            <button
              class="chat-new-messages"
              type="button"
              @click=${e.onScrollToBottom}
            >
              New messages ${M.arrowDown}
            </button>
          `:f}

      <div class="chat-compose">
        ${td(e)}
        <div class="chat-compose__row">
          <label class="field chat-compose__field">
            <span>Message</span>
            <textarea
              ${Oe(u=>u&&jn(u))}
              .value=${e.draft}
              ?disabled=${!e.connected}
              @keydown=${u=>{u.key==="Enter"&&(u.isComposing||u.keyCode===229||u.shiftKey||e.connected&&(u.preventDefault(),t&&e.onSend()))}}
              @input=${u=>{const b=u.target;jn(b),e.onDraftChange(b.value)}}
              @paste=${u=>ed(u,e)}
              placeholder=${g}
            ></textarea>
          </label>
          <div class="chat-compose__actions">
            <button
              class="btn"
              ?disabled=${!e.connected||!i&&e.sending}
              @click=${i?e.onAbort:e.onNewSession}
            >
              ${i?"Stop":"New session"}
            </button>
            <button
              class="btn primary"
              ?disabled=${!e.connected}
              @click=${e.onSend}
            >
              ${n?"Queue":"Send"}<kbd class="btn-kbd">↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </section>
  `}const Hn=200;function id(e){const t=[];let n=null;for(const i of e){if(i.kind!=="message"){n&&(t.push(n),n=null),t.push(i);continue}const s=vs(i.message),a=en(s.role),l=s.timestamp||Date.now();!n||n.role!==a?(n&&t.push(n),n={kind:"group",key:`group:${a}:${i.key}`,role:a,messages:[{message:i.message,key:i.key}],timestamp:l,isStreaming:!1}):n.messages.push({message:i.message,key:i.key})}return n&&t.push(n),t}function sd(e){const t=[],n=Array.isArray(e.messages)?e.messages:[],i=Array.isArray(e.toolMessages)?e.toolMessages:[],s=Math.max(0,n.length-Hn);s>0&&t.push({kind:"message",key:"chat:history:notice",message:{role:"system",content:`Showing last ${Hn} messages (${s} hidden).`,timestamp:Date.now()}});for(let a=s;a<n.length;a++){const l=n[a],r=vs(l);!e.showThinking&&r.role.toLowerCase()==="toolresult"||t.push({kind:"message",key:zn(l,a),message:l})}if(e.showThinking)for(let a=0;a<i.length;a++)t.push({kind:"message",key:zn(i[a],a+n.length),message:i[a]});if(e.stream!==null){const a=`stream:${e.sessionKey}:${e.streamStartedAt??"live"}`;e.stream.trim().length>0?t.push({kind:"stream",key:a,text:e.stream,startedAt:e.streamStartedAt??Date.now()}):t.push({kind:"reading-indicator",key:a})}return id(t)}function zn(e,t){const n=e,i=typeof n.toolCallId=="string"?n.toolCallId:"";if(i)return`tool:${i}`;const s=typeof n.id=="string"?n.id:"";if(s)return`msg:${s}`;const a=typeof n.messageId=="string"?n.messageId:"";if(a)return`msg:${a}`;const l=typeof n.timestamp=="number"?n.timestamp:null,r=typeof n.role=="string"?n.role:"unknown";return l!=null?`msg:${r}:${l}:${t}`:`msg:${r}:${t}`}const Rt={all:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  `,env:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"></circle>
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      ></path>
    </svg>
  `,update:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `,agents:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"
      ></path>
      <circle cx="8" cy="14" r="1"></circle>
      <circle cx="16" cy="14" r="1"></circle>
    </svg>
  `,auth:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  `,channels:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `,messages:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  `,commands:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  `,hooks:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  `,skills:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      ></polygon>
    </svg>
  `,tools:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      ></path>
    </svg>
  `,gateway:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      ></path>
    </svg>
  `,wizard:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 4V2"></path>
      <path d="M15 16v-2"></path>
      <path d="M8 9h2"></path>
      <path d="M20 9h2"></path>
      <path d="M17.8 11.8 19 13"></path>
      <path d="M15 9h0"></path>
      <path d="M17.8 6.2 19 5"></path>
      <path d="m3 21 9-9"></path>
      <path d="M12.2 6.2 11 5"></path>
    </svg>
  `,meta:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    </svg>
  `,logging:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  `,browser:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="4"></circle>
      <line x1="21.17" y1="8" x2="12" y2="8"></line>
      <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
      <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
    </svg>
  `,ui:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  `,models:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      ></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  `,bindings:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
  `,broadcast:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
      <circle cx="12" cy="12" r="2"></circle>
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
    </svg>
  `,audio:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>
  `,session:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  `,cron:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  `,web:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      ></path>
    </svg>
  `,discovery:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `,canvasHost:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  `,talk:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  `,plugins:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2v6"></path>
      <path d="m4.93 10.93 4.24 4.24"></path>
      <path d="M2 12h6"></path>
      <path d="m4.93 13.07 4.24-4.24"></path>
      <path d="M12 22v-6"></path>
      <path d="m19.07 13.07-4.24-4.24"></path>
      <path d="M22 12h-6"></path>
      <path d="m19.07 10.93-4.24 4.24"></path>
    </svg>
  `,default:o`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  `},Vn=[{key:"env",label:"Environment"},{key:"update",label:"Updates"},{key:"agents",label:"Agents"},{key:"auth",label:"Authentication"},{key:"channels",label:"Channels"},{key:"messages",label:"Messages"},{key:"commands",label:"Commands"},{key:"hooks",label:"Hooks"},{key:"skills",label:"Skills"},{key:"tools",label:"Tools"},{key:"gateway",label:"Gateway"},{key:"wizard",label:"Setup Wizard"}],qn="__all__";function Gn(e){return Rt[e]??Rt.default}function ad(e,t){const n=Zt[e];return n||{label:t?.title??q(e),description:t?.description??""}}function od(e){const{key:t,schema:n,uiHints:i}=e;if(!n||U(n)!=="object"||!n.properties)return[];const s=Object.entries(n.properties).map(([a,l])=>{const r=D([t,a],i),d=r?.label??l.title??q(a),g=r?.help??l.description??"",p=r?.order??50;return{key:a,label:d,description:g,order:p}});return s.sort((a,l)=>a.order!==l.order?a.order-l.order:a.key.localeCompare(l.key)),s}function ld(e,t){if(!e||!t)return[];const n=[];function i(s,a,l){if(s===a)return;if(typeof s!=typeof a){n.push({path:l,from:s,to:a});return}if(typeof s!="object"||s===null||a===null){s!==a&&n.push({path:l,from:s,to:a});return}if(Array.isArray(s)&&Array.isArray(a)){JSON.stringify(s)!==JSON.stringify(a)&&n.push({path:l,from:s,to:a});return}const r=s,d=a,g=new Set([...Object.keys(r),...Object.keys(d)]);for(const p of g)i(r[p],d[p],l?`${l}.${p}`:p)}return i(e,t,""),n}function Wn(e,t=40){let n;try{n=JSON.stringify(e)??String(e)}catch{n=String(e)}return n.length<=t?n:n.slice(0,t-3)+"..."}function rd(e){const t=e.valid==null?"unknown":e.valid?"valid":"invalid",n=ds(e.schema),i=n.schema?n.unsupportedPaths.length>0:!1,s=n.schema?.properties??{},a=Vn.filter(x=>x.key in s),l=new Set(Vn.map(x=>x.key)),r=Object.keys(s).filter(x=>!l.has(x)).map(x=>({key:x,label:x.charAt(0).toUpperCase()+x.slice(1)})),d=[...a,...r],g=e.activeSection&&n.schema&&U(n.schema)==="object"?n.schema.properties?.[e.activeSection]:void 0,p=e.activeSection?ad(e.activeSection,g):null,v=e.activeSection?od({key:e.activeSection,schema:g,uiHints:e.uiHints}):[],c=e.formMode==="form"&&!!e.activeSection&&v.length>0,u=e.activeSubsection===qn,b=e.searchQuery||u?null:e.activeSubsection??v[0]?.key??null,w=e.formMode==="form"?ld(e.originalValue,e.formValue):[],$=e.formMode==="raw"&&e.raw!==e.originalRaw,S=e.formMode==="form"?w.length>0:$,k=!!e.formValue&&!e.loading&&!!n.schema,C=e.connected&&!e.saving&&S&&(e.formMode==="raw"?!0:k),L=e.connected&&!e.applying&&!e.updating&&S&&(e.formMode==="raw"?!0:k),I=e.connected&&!e.applying&&!e.updating;return o`
    <div class="config-layout">
      <!-- Sidebar -->
      <aside class="config-sidebar">
        <div class="config-sidebar__header">
          <div class="config-sidebar__title">Settings</div>
          <span
            class="pill pill--sm ${t==="valid"?"pill--ok":t==="invalid"?"pill--danger":""}"
            >${t}</span
          >
        </div>

        <!-- Search -->
        <div class="config-search">
          <svg
            class="config-search__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            class="config-search__input"
            placeholder="Search settings..."
            .value=${e.searchQuery}
            @input=${x=>e.onSearchChange(x.target.value)}
          />
          ${e.searchQuery?o`
                <button
                  class="config-search__clear"
                  @click=${()=>e.onSearchChange("")}
                >
                  ×
                </button>
              `:f}
        </div>

        <!-- Section nav -->
        <nav class="config-nav">
          <button
            class="config-nav__item ${e.activeSection===null?"active":""}"
            @click=${()=>e.onSectionChange(null)}
          >
            <span class="config-nav__icon">${Rt.all}</span>
            <span class="config-nav__label">All Settings</span>
          </button>
          ${d.map(x=>o`
              <button
                class="config-nav__item ${e.activeSection===x.key?"active":""}"
                @click=${()=>e.onSectionChange(x.key)}
              >
                <span class="config-nav__icon"
                  >${Gn(x.key)}</span
                >
                <span class="config-nav__label">${x.label}</span>
              </button>
            `)}
        </nav>

        <!-- Mode toggle at bottom -->
        <div class="config-sidebar__footer">
          <div class="config-mode-toggle">
            <button
              class="config-mode-toggle__btn ${e.formMode==="form"?"active":""}"
              ?disabled=${e.schemaLoading||!e.schema}
              @click=${()=>e.onFormModeChange("form")}
            >
              Form
            </button>
            <button
              class="config-mode-toggle__btn ${e.formMode==="raw"?"active":""}"
              @click=${()=>e.onFormModeChange("raw")}
            >
              Raw
            </button>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="config-main">
        <!-- Action bar -->
        <div class="config-actions">
          <div class="config-actions__left">
            ${S?o`
                  <span class="config-changes-badge"
                    >${e.formMode==="raw"?"Unsaved changes":`${w.length} unsaved change${w.length!==1?"s":""}`}</span
                  >
                `:o`
                    <span class="config-status muted">No changes</span>
                  `}
          </div>
          <div class="config-actions__right">
            <button
              class="btn btn--sm"
              ?disabled=${e.loading}
              @click=${e.onReload}
            >
              ${e.loading?"Loading…":"Reload"}
            </button>
            <button
              class="btn btn--sm primary"
              ?disabled=${!C}
              @click=${e.onSave}
            >
              ${e.saving?"Saving…":"Save"}
            </button>
            <button
              class="btn btn--sm"
              ?disabled=${!L}
              @click=${e.onApply}
            >
              ${e.applying?"Applying…":"Apply"}
            </button>
            <button
              class="btn btn--sm"
              ?disabled=${!I}
              @click=${e.onUpdate}
            >
              ${e.updating?"Updating…":"Update"}
            </button>
          </div>
        </div>

        <!-- Diff panel (form mode only - raw mode doesn't have granular diff) -->
        ${S&&e.formMode==="form"?o`
              <details class="config-diff">
                <summary class="config-diff__summary">
                  <span
                    >View ${w.length} pending
                    change${w.length!==1?"s":""}</span
                  >
                  <svg
                    class="config-diff__chevron"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </summary>
                <div class="config-diff__content">
                  ${w.map(x=>o`
                      <div class="config-diff__item">
                        <div class="config-diff__path">${x.path}</div>
                        <div class="config-diff__values">
                          <span class="config-diff__from"
                            >${Wn(x.from)}</span
                          >
                          <span class="config-diff__arrow">→</span>
                          <span class="config-diff__to"
                            >${Wn(x.to)}</span
                          >
                        </div>
                      </div>
                    `)}
                </div>
              </details>
            `:f}
        ${p&&e.formMode==="form"?o`
              <div class="config-section-hero">
                <div class="config-section-hero__icon">
                  ${Gn(e.activeSection??"")}
                </div>
                <div class="config-section-hero__text">
                  <div class="config-section-hero__title">
                    ${p.label}
                  </div>
                  ${p.description?o`<div class="config-section-hero__desc">
                        ${p.description}
                      </div>`:f}
                </div>
              </div>
            `:f}
        ${c?o`
              <div class="config-subnav">
                <button
                  class="config-subnav__item ${b===null?"active":""}"
                  @click=${()=>e.onSubsectionChange(qn)}
                >
                  All
                </button>
                ${v.map(x=>o`
                    <button
                      class="config-subnav__item ${b===x.key?"active":""}"
                      title=${x.description||x.label}
                      @click=${()=>e.onSubsectionChange(x.key)}
                    >
                      ${x.label}
                    </button>
                  `)}
              </div>
            `:f}

        <!-- Form content -->
        <div class="config-content">
          ${e.formMode==="form"?o`
                ${e.schemaLoading?o`
                        <div class="config-loading">
                          <div class="config-loading__spinner"></div>
                          <span>Loading schema…</span>
                        </div>
                      `:Ir({schema:n.schema,uiHints:e.uiHints,value:e.formValue,disabled:e.loading||!e.formValue,unsupportedPaths:n.unsupportedPaths,onPatch:e.onFormPatch,searchQuery:e.searchQuery,activeSection:e.activeSection,activeSubsection:b})}
                ${i?o`
                        <div class="callout danger" style="margin-top: 12px">
                          Form view can't safely edit some fields. Use Raw to avoid losing config entries.
                        </div>
                      `:f}
              `:o`
                <label class="field config-raw-field">
                  <span>Raw JSON5</span>
                  <textarea
                    .value=${e.raw}
                    @input=${x=>e.onRawChange(x.target.value)}
                  ></textarea>
                </label>
              `}
        </div>

        ${e.issues.length>0?o`<div class="callout danger" style="margin-top: 12px;">
              <pre class="code-block">
${JSON.stringify(e.issues,null,2)}</pre
              >
            </div>`:f}
      </main>
    </div>
  `}function cd(e){const t=["last",...e.channels.filter(Boolean)],n=e.form.channel?.trim();n&&!t.includes(n)&&t.push(n);const i=new Set;return t.filter(s=>i.has(s)?!1:(i.add(s),!0))}function dd(e,t){if(t==="last")return"last";const n=e.channelMeta?.find(i=>i.id===t);return n?.label?n.label:e.channelLabels?.[t]??t}function ud(e){const t=cd(e);return o`
    <section class="grid grid-cols-2">
      <div class="card">
        <div class="card-title">Scheduler</div>
        <div class="card-sub">Gateway-owned cron scheduler status.</div>
        <div class="stat-grid" style="margin-top: 16px;">
          <div class="stat">
            <div class="stat-label">Enabled</div>
            <div class="stat-value">
              ${e.status?e.status.enabled?"Yes":"No":"n/a"}
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">Jobs</div>
            <div class="stat-value">${e.status?.jobs??"n/a"}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Next wake</div>
            <div class="stat-value">${Xt(e.status?.nextWakeAtMs??null)}</div>
          </div>
        </div>
        <div class="row" style="margin-top: 12px;">
          <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
            ${e.loading?"Refreshing…":"Refresh"}
          </button>
          ${e.error?o`<span class="muted">${e.error}</span>`:f}
        </div>
      </div>

      <div class="card">
        <div class="card-title">New Job</div>
        <div class="card-sub">Create a scheduled wakeup or agent run.</div>
        <div class="form-grid" style="margin-top: 16px;">
          <label class="field">
            <span>Name</span>
            <input
              .value=${e.form.name}
              @input=${n=>e.onFormChange({name:n.target.value})}
            />
          </label>
          <label class="field">
            <span>Description</span>
            <input
              .value=${e.form.description}
              @input=${n=>e.onFormChange({description:n.target.value})}
            />
          </label>
          <label class="field">
            <span>Agent ID</span>
            <input
              .value=${e.form.agentId}
              @input=${n=>e.onFormChange({agentId:n.target.value})}
              placeholder="default"
            />
          </label>
          <label class="field checkbox">
            <span>Enabled</span>
            <input
              type="checkbox"
              .checked=${e.form.enabled}
              @change=${n=>e.onFormChange({enabled:n.target.checked})}
            />
          </label>
          <label class="field">
            <span>Schedule</span>
            <select
              .value=${e.form.scheduleKind}
              @change=${n=>e.onFormChange({scheduleKind:n.target.value})}
            >
              <option value="every">Every</option>
              <option value="at">At</option>
              <option value="cron">Cron</option>
            </select>
          </label>
        </div>
        ${gd(e)}
        <div class="form-grid" style="margin-top: 12px;">
          <label class="field">
            <span>Session</span>
            <select
              .value=${e.form.sessionTarget}
              @change=${n=>e.onFormChange({sessionTarget:n.target.value})}
            >
              <option value="main">Main</option>
              <option value="isolated">Isolated</option>
            </select>
          </label>
          <label class="field">
            <span>Wake mode</span>
            <select
              .value=${e.form.wakeMode}
              @change=${n=>e.onFormChange({wakeMode:n.target.value})}
            >
              <option value="next-heartbeat">Next heartbeat</option>
              <option value="now">Now</option>
            </select>
          </label>
          <label class="field">
            <span>Payload</span>
            <select
              .value=${e.form.payloadKind}
              @change=${n=>e.onFormChange({payloadKind:n.target.value})}
            >
              <option value="systemEvent">System event</option>
              <option value="agentTurn">Agent turn</option>
            </select>
          </label>
        </div>
        <label class="field" style="margin-top: 12px;">
          <span>${e.form.payloadKind==="systemEvent"?"System text":"Agent message"}</span>
          <textarea
            .value=${e.form.payloadText}
            @input=${n=>e.onFormChange({payloadText:n.target.value})}
            rows="4"
          ></textarea>
        </label>
	          ${e.form.payloadKind==="agentTurn"?o`
	              <div class="form-grid" style="margin-top: 12px;">
                <label class="field checkbox">
                  <span>Deliver</span>
                  <input
                    type="checkbox"
                    .checked=${e.form.deliver}
                    @change=${n=>e.onFormChange({deliver:n.target.checked})}
                  />
	                </label>
	                <label class="field">
	                  <span>Channel</span>
	                  <select
	                    .value=${e.form.channel||"last"}
	                    @change=${n=>e.onFormChange({channel:n.target.value})}
	                  >
	                    ${t.map(n=>o`<option value=${n}>
                            ${dd(e,n)}
                          </option>`)}
                  </select>
                </label>
                <label class="field">
                  <span>To</span>
                  <input
                    .value=${e.form.to}
                    @input=${n=>e.onFormChange({to:n.target.value})}
                    placeholder="+1555… or chat id"
                  />
                </label>
                <label class="field">
                  <span>Timeout (seconds)</span>
                  <input
                    .value=${e.form.timeoutSeconds}
                    @input=${n=>e.onFormChange({timeoutSeconds:n.target.value})}
                  />
                </label>
                ${e.form.sessionTarget==="isolated"?o`
                      <label class="field">
                        <span>Post to main prefix</span>
                        <input
                          .value=${e.form.postToMainPrefix}
                          @input=${n=>e.onFormChange({postToMainPrefix:n.target.value})}
                        />
                      </label>
                    `:f}
              </div>
            `:f}
        <div class="row" style="margin-top: 14px;">
          <button class="btn primary" ?disabled=${e.busy} @click=${e.onAdd}>
            ${e.busy?"Saving…":"Add job"}
          </button>
        </div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">Jobs</div>
      <div class="card-sub">All scheduled jobs stored in the gateway.</div>
      ${e.jobs.length===0?o`
              <div class="muted" style="margin-top: 12px">No jobs yet.</div>
            `:o`
            <div class="list" style="margin-top: 12px;">
              ${e.jobs.map(n=>fd(n,e))}
            </div>
          `}
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">Run history</div>
      <div class="card-sub">Latest runs for ${e.runsJobId??"(select a job)"}.</div>
      ${e.runsJobId==null?o`
              <div class="muted" style="margin-top: 12px">Select a job to inspect run history.</div>
            `:e.runs.length===0?o`
                <div class="muted" style="margin-top: 12px">No runs yet.</div>
              `:o`
              <div class="list" style="margin-top: 12px;">
                ${e.runs.map(n=>vd(n))}
              </div>
            `}
    </section>
  `}function gd(e){const t=e.form;return t.scheduleKind==="at"?o`
      <label class="field" style="margin-top: 12px;">
        <span>Run at</span>
        <input
          type="datetime-local"
          .value=${t.scheduleAt}
          @input=${n=>e.onFormChange({scheduleAt:n.target.value})}
        />
      </label>
    `:t.scheduleKind==="every"?o`
      <div class="form-grid" style="margin-top: 12px;">
        <label class="field">
          <span>Every</span>
          <input
            .value=${t.everyAmount}
            @input=${n=>e.onFormChange({everyAmount:n.target.value})}
          />
        </label>
        <label class="field">
          <span>Unit</span>
          <select
            .value=${t.everyUnit}
            @change=${n=>e.onFormChange({everyUnit:n.target.value})}
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </label>
      </div>
    `:o`
    <div class="form-grid" style="margin-top: 12px;">
      <label class="field">
        <span>Expression</span>
        <input
          .value=${t.cronExpr}
          @input=${n=>e.onFormChange({cronExpr:n.target.value})}
        />
      </label>
      <label class="field">
        <span>Timezone (optional)</span>
        <input
          .value=${t.cronTz}
          @input=${n=>e.onFormChange({cronTz:n.target.value})}
        />
      </label>
    </div>
  `}function fd(e,t){const i=`list-item list-item-clickable${t.runsJobId===e.id?" list-item-selected":""}`;return o`
    <div class=${i} @click=${()=>t.onLoadRuns(e.id)}>
      <div class="list-main">
        <div class="list-title">${e.name}</div>
        <div class="list-sub">${is(e)}</div>
        <div class="muted">${ss(e)}</div>
        ${e.agentId?o`<div class="muted">Agent: ${e.agentId}</div>`:f}
        <div class="chip-row" style="margin-top: 6px;">
          <span class="chip">${e.enabled?"enabled":"disabled"}</span>
          <span class="chip">${e.sessionTarget}</span>
          <span class="chip">${e.wakeMode}</span>
        </div>
      </div>
      <div class="list-meta">
        <div>${ns(e)}</div>
        <div class="row" style="justify-content: flex-end; margin-top: 8px;">
          <button
            class="btn"
            ?disabled=${t.busy}
            @click=${s=>{s.stopPropagation(),t.onToggle(e,!e.enabled)}}
          >
            ${e.enabled?"Disable":"Enable"}
          </button>
          <button
            class="btn"
            ?disabled=${t.busy}
            @click=${s=>{s.stopPropagation(),t.onRun(e)}}
          >
            Run
          </button>
          <button
            class="btn"
            ?disabled=${t.busy}
            @click=${s=>{s.stopPropagation(),t.onLoadRuns(e.id)}}
          >
            Runs
          </button>
          <button
            class="btn danger"
            ?disabled=${t.busy}
            @click=${s=>{s.stopPropagation(),t.onRemove(e)}}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  `}function vd(e){return o`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${e.status}</div>
        <div class="list-sub">${e.summary??""}</div>
      </div>
      <div class="list-meta">
        <div>${he(e.ts)}</div>
        <div class="muted">${e.durationMs??0}ms</div>
        ${e.error?o`<div class="muted">${e.error}</div>`:f}
      </div>
    </div>
  `}function pd(e){const n=(e.status&&typeof e.status=="object"?e.status.securityAudit:null)?.summary??null,i=n?.critical??0,s=n?.warn??0,a=n?.info??0,l=i>0?"danger":s>0?"warn":"success",r=i>0?`${i} critical`:s>0?`${s} warnings`:"No critical issues";return o`
    <section class="grid grid-cols-2">
      <div class="card">
        <div class="row" style="justify-content: space-between;">
          <div>
            <div class="card-title">Snapshots</div>
            <div class="card-sub">Status, health, and heartbeat data.</div>
          </div>
          <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
            ${e.loading?"Refreshing…":"Refresh"}
          </button>
        </div>
        <div class="stack" style="margin-top: 12px;">
          <div>
            <div class="muted">Status</div>
            ${n?o`<div class="callout ${l}" style="margin-top: 8px;">
                  Security audit: ${r}${a>0?` · ${a} info`:""}. Run
                  <span class="mono">openclaw security audit --deep</span> for details.
                </div>`:f}
            <pre class="code-block">${JSON.stringify(e.status??{},null,2)}</pre>
          </div>
          <div>
            <div class="muted">Health</div>
            <pre class="code-block">${JSON.stringify(e.health??{},null,2)}</pre>
          </div>
          <div>
            <div class="muted">Last heartbeat</div>
            <pre class="code-block">${JSON.stringify(e.heartbeat??{},null,2)}</pre>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Manual RPC</div>
        <div class="card-sub">Send a raw gateway method with JSON params.</div>
        <div class="form-grid" style="margin-top: 16px;">
          <label class="field">
            <span>Method</span>
            <input
              .value=${e.callMethod}
              @input=${d=>e.onCallMethodChange(d.target.value)}
              placeholder="system-presence"
            />
          </label>
          <label class="field">
            <span>Params (JSON)</span>
            <textarea
              .value=${e.callParams}
              @input=${d=>e.onCallParamsChange(d.target.value)}
              rows="6"
            ></textarea>
          </label>
        </div>
        <div class="row" style="margin-top: 12px;">
          <button class="btn primary" @click=${e.onCall}>Call</button>
        </div>
        ${e.callError?o`<div class="callout danger" style="margin-top: 12px;">
              ${e.callError}
            </div>`:f}
        ${e.callResult?o`<pre class="code-block" style="margin-top: 12px;">${e.callResult}</pre>`:f}
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">Models</div>
      <div class="card-sub">Catalog from models.list.</div>
      <pre class="code-block" style="margin-top: 12px;">${JSON.stringify(e.models??[],null,2)}</pre>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">Event Log</div>
      <div class="card-sub">Latest gateway events.</div>
      ${e.eventLog.length===0?o`
              <div class="muted" style="margin-top: 12px">No events yet.</div>
            `:o`
            <div class="list" style="margin-top: 12px;">
              ${e.eventLog.map(d=>o`
                  <div class="list-item">
                    <div class="list-main">
                      <div class="list-title">${d.event}</div>
                      <div class="list-sub">${new Date(d.ts).toLocaleTimeString()}</div>
                    </div>
                    <div class="list-meta">
                      <pre class="code-block">${zl(d.payload)}</pre>
                    </div>
                  </div>
                `)}
            </div>
          `}
    </section>
  `}function hd(e){const t=Math.max(0,e),n=Math.floor(t/1e3);if(n<60)return`${n}s`;const i=Math.floor(n/60);return i<60?`${i}m`:`${Math.floor(i/60)}h`}function X(e,t){return t?o`<div class="exec-approval-meta-row"><span>${e}</span><span>${t}</span></div>`:f}function md(e){const t=e.execApprovalQueue[0];if(!t)return f;const n=t.request,i=t.expiresAtMs-Date.now(),s=i>0?`expires in ${hd(i)}`:"expired",a=e.execApprovalQueue.length;return o`
    <div class="exec-approval-overlay" role="dialog" aria-live="polite">
      <div class="exec-approval-card">
        <div class="exec-approval-header">
          <div>
            <div class="exec-approval-title">Exec approval needed</div>
            <div class="exec-approval-sub">${s}</div>
          </div>
          ${a>1?o`<div class="exec-approval-queue">${a} pending</div>`:f}
        </div>
        <div class="exec-approval-command mono">${n.command}</div>
        <div class="exec-approval-meta">
          ${X("Host",n.host)}
          ${X("Agent",n.agentId)}
          ${X("Session",n.sessionKey)}
          ${X("CWD",n.cwd)}
          ${X("Resolved",n.resolvedPath)}
          ${X("Security",n.security)}
          ${X("Ask",n.ask)}
        </div>
        ${e.execApprovalError?o`<div class="exec-approval-error">${e.execApprovalError}</div>`:f}
        <div class="exec-approval-actions">
          <button
            class="btn primary"
            ?disabled=${e.execApprovalBusy}
            @click=${()=>e.handleExecApprovalDecision("allow-once")}
          >
            Allow once
          </button>
          <button
            class="btn"
            ?disabled=${e.execApprovalBusy}
            @click=${()=>e.handleExecApprovalDecision("allow-always")}
          >
            Always allow
          </button>
          <button
            class="btn danger"
            ?disabled=${e.execApprovalBusy}
            @click=${()=>e.handleExecApprovalDecision("deny")}
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  `}function yd(e){const{pendingGatewayUrl:t}=e;return t?o`
    <div class="exec-approval-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div class="exec-approval-card">
        <div class="exec-approval-header">
          <div>
            <div class="exec-approval-title">Change Gateway URL</div>
            <div class="exec-approval-sub">This will reconnect to a different gateway server</div>
          </div>
        </div>
        <div class="exec-approval-command mono">${t}</div>
        <div class="callout danger" style="margin-top: 12px;">
          Only confirm if you trust this URL. Malicious URLs can compromise your system.
        </div>
        <div class="exec-approval-actions">
          <button
            class="btn primary"
            @click=${()=>e.handleGatewayUrlConfirm()}
          >
            Confirm
          </button>
          <button
            class="btn"
            @click=${()=>e.handleGatewayUrlCancel()}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  `:f}function bd(e){return o`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Connected Instances</div>
          <div class="card-sub">Presence beacons from the gateway and clients.</div>
        </div>
        <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
          ${e.loading?"Loading…":"Refresh"}
        </button>
      </div>
      ${e.lastError?o`<div class="callout danger" style="margin-top: 12px;">
            ${e.lastError}
          </div>`:f}
      ${e.statusMessage?o`<div class="callout" style="margin-top: 12px;">
            ${e.statusMessage}
          </div>`:f}
      <div class="list" style="margin-top: 16px;">
        ${e.entries.length===0?o`
                <div class="muted">No instances reported yet.</div>
              `:e.entries.map(t=>wd(t))}
      </div>
    </section>
  `}function wd(e){const t=e.lastInputSeconds!=null?`${e.lastInputSeconds}s ago`:"n/a",n=e.mode??"unknown",i=Array.isArray(e.roles)?e.roles.filter(Boolean):[],s=Array.isArray(e.scopes)?e.scopes.filter(Boolean):[],a=s.length>0?s.length>3?`${s.length} scopes`:`scopes: ${s.join(", ")}`:null;return o`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${e.host??"unknown host"}</div>
        <div class="list-sub">${Ul(e)}</div>
        <div class="chip-row">
          <span class="chip">${n}</span>
          ${i.map(l=>o`<span class="chip">${l}</span>`)}
          ${a?o`<span class="chip">${a}</span>`:f}
          ${e.platform?o`<span class="chip">${e.platform}</span>`:f}
          ${e.deviceFamily?o`<span class="chip">${e.deviceFamily}</span>`:f}
          ${e.modelIdentifier?o`<span class="chip">${e.modelIdentifier}</span>`:f}
          ${e.version?o`<span class="chip">${e.version}</span>`:f}
        </div>
      </div>
      <div class="list-meta">
        <div>${jl(e)}</div>
        <div class="muted">Last input ${t}</div>
        <div class="muted">Reason ${e.reason??""}</div>
      </div>
    </div>
  `}const Yn=["trace","debug","info","warn","error","fatal"];function $d(e){if(!e)return"";const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleTimeString()}function Sd(e,t){return t?[e.message,e.subsystem,e.raw].filter(Boolean).join(" ").toLowerCase().includes(t):!0}function kd(e){const t=e.filterText.trim().toLowerCase(),n=Yn.some(a=>!e.levelFilters[a]),i=e.entries.filter(a=>a.level&&!e.levelFilters[a.level]?!1:Sd(a,t)),s=t||n?"filtered":"visible";return o`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Logs</div>
          <div class="card-sub">Gateway file logs (JSONL).</div>
        </div>
        <div class="row" style="gap: 8px;">
          <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
            ${e.loading?"Loading…":"Refresh"}
          </button>
          <button
            class="btn"
            ?disabled=${i.length===0}
            @click=${()=>e.onExport(i.map(a=>a.raw),s)}
          >
            Export ${s}
          </button>
        </div>
      </div>

      <div class="filters" style="margin-top: 14px;">
        <label class="field" style="min-width: 220px;">
          <span>Filter</span>
          <input
            .value=${e.filterText}
            @input=${a=>e.onFilterTextChange(a.target.value)}
            placeholder="Search logs"
          />
        </label>
        <label class="field checkbox">
          <span>Auto-follow</span>
          <input
            type="checkbox"
            .checked=${e.autoFollow}
            @change=${a=>e.onToggleAutoFollow(a.target.checked)}
          />
        </label>
      </div>

      <div class="chip-row" style="margin-top: 12px;">
        ${Yn.map(a=>o`
            <label class="chip log-chip ${a}">
              <input
                type="checkbox"
                .checked=${e.levelFilters[a]}
                @change=${l=>e.onLevelToggle(a,l.target.checked)}
              />
              <span>${a}</span>
            </label>
          `)}
      </div>

      ${e.file?o`<div class="muted" style="margin-top: 10px;">File: ${e.file}</div>`:f}
      ${e.truncated?o`
              <div class="callout" style="margin-top: 10px">Log output truncated; showing latest chunk.</div>
            `:f}
      ${e.error?o`<div class="callout danger" style="margin-top: 10px;">${e.error}</div>`:f}

      <div class="log-stream" style="margin-top: 12px;" @scroll=${e.onScroll}>
        ${i.length===0?o`
                <div class="muted" style="padding: 12px">No log entries.</div>
              `:i.map(a=>o`
                <div class="log-row">
                  <div class="log-time mono">${$d(a.time)}</div>
                  <div class="log-level ${a.level??""}">${a.level??""}</div>
                  <div class="log-subsystem mono">${a.subsystem??""}</div>
                  <div class="log-message mono">${a.message??a.raw}</div>
                </div>
              `)}
      </div>
    </section>
  `}function xd(e){const t=Td(e),n=Nd(e);return o`
    ${Dd(n)}
    ${Bd(t)}
    ${Ad(e)}
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Nodes</div>
          <div class="card-sub">Paired devices and live links.</div>
        </div>
        <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
          ${e.loading?"Loading…":"Refresh"}
        </button>
      </div>
      <div class="list" style="margin-top: 16px;">
        ${e.nodes.length===0?o`
                <div class="muted">No nodes found.</div>
              `:e.nodes.map(i=>Wd(i))}
      </div>
    </section>
  `}function Ad(e){const t=e.devicesList??{pending:[],paired:[]},n=Array.isArray(t.pending)?t.pending:[],i=Array.isArray(t.paired)?t.paired:[];return o`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Devices</div>
          <div class="card-sub">Pairing requests + role tokens.</div>
        </div>
        <button class="btn" ?disabled=${e.devicesLoading} @click=${e.onDevicesRefresh}>
          ${e.devicesLoading?"Loading…":"Refresh"}
        </button>
      </div>
      ${e.devicesError?o`<div class="callout danger" style="margin-top: 12px;">${e.devicesError}</div>`:f}
      <div class="list" style="margin-top: 16px;">
        ${n.length>0?o`
              <div class="muted" style="margin-bottom: 8px;">Pending</div>
              ${n.map(s=>Cd(s,e))}
            `:f}
        ${i.length>0?o`
              <div class="muted" style="margin-top: 12px; margin-bottom: 8px;">Paired</div>
              ${i.map(s=>Id(s,e))}
            `:f}
        ${n.length===0&&i.length===0?o`
                <div class="muted">No paired devices.</div>
              `:f}
      </div>
    </section>
  `}function Cd(e,t){const n=e.displayName?.trim()||e.deviceId,i=typeof e.ts=="number"?T(e.ts):"n/a",s=e.role?.trim()?`role: ${e.role}`:"role: -",a=e.isRepair?" · repair":"",l=e.remoteIp?` · ${e.remoteIp}`:"";return o`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${n}</div>
        <div class="list-sub">${e.deviceId}${l}</div>
        <div class="muted" style="margin-top: 6px;">
          ${s} · requested ${i}${a}
        </div>
      </div>
      <div class="list-meta">
        <div class="row" style="justify-content: flex-end; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn--sm primary" @click=${()=>t.onDeviceApprove(e.requestId)}>
            Approve
          </button>
          <button class="btn btn--sm" @click=${()=>t.onDeviceReject(e.requestId)}>
            Reject
          </button>
        </div>
      </div>
    </div>
  `}function Id(e,t){const n=e.displayName?.trim()||e.deviceId,i=e.remoteIp?` · ${e.remoteIp}`:"",s=`roles: ${mt(e.roles)}`,a=`scopes: ${mt(e.scopes)}`,l=Array.isArray(e.tokens)?e.tokens:[];return o`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${n}</div>
        <div class="list-sub">${e.deviceId}${i}</div>
        <div class="muted" style="margin-top: 6px;">${s} · ${a}</div>
        ${l.length===0?o`
                <div class="muted" style="margin-top: 6px">Tokens: none</div>
              `:o`
              <div class="muted" style="margin-top: 10px;">Tokens</div>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                ${l.map(r=>Ld(e.deviceId,r,t))}
              </div>
            `}
      </div>
    </div>
  `}function Ld(e,t,n){const i=t.revokedAtMs?"revoked":"active",s=`scopes: ${mt(t.scopes)}`,a=T(t.rotatedAtMs??t.createdAtMs??t.lastUsedAtMs??null);return o`
    <div class="row" style="justify-content: space-between; gap: 8px;">
      <div class="list-sub">${t.role} · ${i} · ${s} · ${a}</div>
      <div class="row" style="justify-content: flex-end; gap: 6px; flex-wrap: wrap;">
        <button
          class="btn btn--sm"
          @click=${()=>n.onDeviceRotate(e,t.role,t.scopes)}
        >
          Rotate
        </button>
        ${t.revokedAtMs?f:o`
              <button
                class="btn btn--sm danger"
                @click=${()=>n.onDeviceRevoke(e,t.role)}
              >
                Revoke
              </button>
            `}
      </div>
    </div>
  `}const W="__defaults__",Qn=[{value:"deny",label:"Deny"},{value:"allowlist",label:"Allowlist"},{value:"full",label:"Full"}],_d=[{value:"off",label:"Off"},{value:"on-miss",label:"On miss"},{value:"always",label:"Always"}];function Td(e){const t=e.configForm,n=Vd(e.nodes),{defaultBinding:i,agents:s}=Gd(t),a=!!t,l=e.configSaving||e.configFormMode==="raw";return{ready:a,disabled:l,configDirty:e.configDirty,configLoading:e.configLoading,configSaving:e.configSaving,defaultBinding:i,agents:s,nodes:n,onBindDefault:e.onBindDefault,onBindAgent:e.onBindAgent,onSave:e.onSaveBindings,onLoadConfig:e.onLoadConfig,formMode:e.configFormMode}}function Jn(e){return e==="allowlist"||e==="full"||e==="deny"?e:"deny"}function Ed(e){return e==="always"||e==="off"||e==="on-miss"?e:"on-miss"}function Md(e){const t=e?.defaults??{};return{security:Jn(t.security),ask:Ed(t.ask),askFallback:Jn(t.askFallback??"deny"),autoAllowSkills:!!(t.autoAllowSkills??!1)}}function Fd(e){const t=e?.agents??{},n=Array.isArray(t.list)?t.list:[],i=[];return n.forEach(s=>{if(!s||typeof s!="object")return;const a=s,l=typeof a.id=="string"?a.id.trim():"";if(!l)return;const r=typeof a.name=="string"?a.name.trim():void 0,d=a.default===!0;i.push({id:l,name:r||void 0,isDefault:d})}),i}function Rd(e,t){const n=Fd(e),i=Object.keys(t?.agents??{}),s=new Map;n.forEach(l=>s.set(l.id,l)),i.forEach(l=>{s.has(l)||s.set(l,{id:l})});const a=Array.from(s.values());return a.length===0&&a.push({id:"main",isDefault:!0}),a.sort((l,r)=>{if(l.isDefault&&!r.isDefault)return-1;if(!l.isDefault&&r.isDefault)return 1;const d=l.name?.trim()?l.name:l.id,g=r.name?.trim()?r.name:r.id;return d.localeCompare(g)}),a}function Pd(e,t){return e===W?W:e&&t.some(n=>n.id===e)?e:W}function Nd(e){const t=e.execApprovalsForm??e.execApprovalsSnapshot?.file??null,n=!!t,i=Md(t),s=Rd(e.configForm,t),a=qd(e.nodes),l=e.execApprovalsTarget;let r=l==="node"&&e.execApprovalsTargetNodeId?e.execApprovalsTargetNodeId:null;l==="node"&&r&&!a.some(v=>v.id===r)&&(r=null);const d=Pd(e.execApprovalsSelectedAgent,s),g=d!==W?(t?.agents??{})[d]??null:null,p=Array.isArray(g?.allowlist)?g.allowlist??[]:[];return{ready:n,disabled:e.execApprovalsSaving||e.execApprovalsLoading,dirty:e.execApprovalsDirty,loading:e.execApprovalsLoading,saving:e.execApprovalsSaving,form:t,defaults:i,selectedScope:d,selectedAgent:g,agents:s,allowlist:p,target:l,targetNodeId:r,targetNodes:a,onSelectScope:e.onExecApprovalsSelectAgent,onSelectTarget:e.onExecApprovalsTargetChange,onPatch:e.onExecApprovalsPatch,onRemove:e.onExecApprovalsRemove,onLoad:e.onLoadExecApprovals,onSave:e.onSaveExecApprovals}}function Bd(e){const t=e.nodes.length>0,n=e.defaultBinding??"";return o`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">Exec node binding</div>
          <div class="card-sub">
            Pin agents to a specific node when using <span class="mono">exec host=node</span>.
          </div>
        </div>
        <button
          class="btn"
          ?disabled=${e.disabled||!e.configDirty}
          @click=${e.onSave}
        >
          ${e.configSaving?"Saving…":"Save"}
        </button>
      </div>

      ${e.formMode==="raw"?o`
              <div class="callout warn" style="margin-top: 12px">
                Switch the Config tab to <strong>Form</strong> mode to edit bindings here.
              </div>
            `:f}

      ${e.ready?o`
            <div class="list" style="margin-top: 16px;">
              <div class="list-item">
                <div class="list-main">
                  <div class="list-title">Default binding</div>
                  <div class="list-sub">Used when agents do not override a node binding.</div>
                </div>
                <div class="list-meta">
                  <label class="field">
                    <span>Node</span>
                    <select
                      ?disabled=${e.disabled||!t}
                      @change=${i=>{const a=i.target.value.trim();e.onBindDefault(a||null)}}
                    >
                      <option value="" ?selected=${n===""}>Any node</option>
                      ${e.nodes.map(i=>o`<option
                            value=${i.id}
                            ?selected=${n===i.id}
                          >
                            ${i.label}
                          </option>`)}
                    </select>
                  </label>
                  ${t?f:o`
                          <div class="muted">No nodes with system.run available.</div>
                        `}
                </div>
              </div>

              ${e.agents.length===0?o`
                      <div class="muted">No agents found.</div>
                    `:e.agents.map(i=>zd(i,e))}
            </div>
          `:o`<div class="row" style="margin-top: 12px; gap: 12px;">
            <div class="muted">Load config to edit bindings.</div>
            <button class="btn" ?disabled=${e.configLoading} @click=${e.onLoadConfig}>
              ${e.configLoading?"Loading…":"Load config"}
            </button>
          </div>`}
    </section>
  `}function Dd(e){const t=e.ready,n=e.target!=="node"||!!e.targetNodeId;return o`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">Exec approvals</div>
          <div class="card-sub">
            Allowlist and approval policy for <span class="mono">exec host=gateway/node</span>.
          </div>
        </div>
        <button
          class="btn"
          ?disabled=${e.disabled||!e.dirty||!n}
          @click=${e.onSave}
        >
          ${e.saving?"Saving…":"Save"}
        </button>
      </div>

      ${Od(e)}

      ${t?o`
            ${Kd(e)}
            ${Ud(e)}
            ${e.selectedScope===W?f:jd(e)}
          `:o`<div class="row" style="margin-top: 12px; gap: 12px;">
            <div class="muted">Load exec approvals to edit allowlists.</div>
            <button class="btn" ?disabled=${e.loading||!n} @click=${e.onLoad}>
              ${e.loading?"Loading…":"Load approvals"}
            </button>
          </div>`}
    </section>
  `}function Od(e){const t=e.targetNodes.length>0,n=e.targetNodeId??"";return o`
    <div class="list" style="margin-top: 12px;">
      <div class="list-item">
        <div class="list-main">
          <div class="list-title">Target</div>
          <div class="list-sub">
            Gateway edits local approvals; node edits the selected node.
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>Host</span>
            <select
              ?disabled=${e.disabled}
              @change=${i=>{if(i.target.value==="node"){const l=e.targetNodes[0]?.id??null;e.onSelectTarget("node",n||l)}else e.onSelectTarget("gateway",null)}}
            >
              <option value="gateway" ?selected=${e.target==="gateway"}>Gateway</option>
              <option value="node" ?selected=${e.target==="node"}>Node</option>
            </select>
          </label>
          ${e.target==="node"?o`
                <label class="field">
                  <span>Node</span>
                  <select
                    ?disabled=${e.disabled||!t}
                    @change=${i=>{const a=i.target.value.trim();e.onSelectTarget("node",a||null)}}
                  >
                    <option value="" ?selected=${n===""}>Select node</option>
                    ${e.targetNodes.map(i=>o`<option
                          value=${i.id}
                          ?selected=${n===i.id}
                        >
                          ${i.label}
                        </option>`)}
                  </select>
                </label>
              `:f}
        </div>
      </div>
      ${e.target==="node"&&!t?o`
              <div class="muted">No nodes advertise exec approvals yet.</div>
            `:f}
    </div>
  `}function Kd(e){return o`
    <div class="row" style="margin-top: 12px; gap: 8px; flex-wrap: wrap;">
      <span class="label">Scope</span>
      <div class="row" style="gap: 8px; flex-wrap: wrap;">
        <button
          class="btn btn--sm ${e.selectedScope===W?"active":""}"
          @click=${()=>e.onSelectScope(W)}
        >
          Defaults
        </button>
        ${e.agents.map(t=>{const n=t.name?.trim()?`${t.name} (${t.id})`:t.id;return o`
            <button
              class="btn btn--sm ${e.selectedScope===t.id?"active":""}"
              @click=${()=>e.onSelectScope(t.id)}
            >
              ${n}
            </button>
          `})}
      </div>
    </div>
  `}function Ud(e){const t=e.selectedScope===W,n=e.defaults,i=e.selectedAgent??{},s=t?["defaults"]:["agents",e.selectedScope],a=typeof i.security=="string"?i.security:void 0,l=typeof i.ask=="string"?i.ask:void 0,r=typeof i.askFallback=="string"?i.askFallback:void 0,d=t?n.security:a??"__default__",g=t?n.ask:l??"__default__",p=t?n.askFallback:r??"__default__",v=typeof i.autoAllowSkills=="boolean"?i.autoAllowSkills:void 0,c=v??n.autoAllowSkills,u=v==null;return o`
    <div class="list" style="margin-top: 16px;">
      <div class="list-item">
        <div class="list-main">
          <div class="list-title">Security</div>
          <div class="list-sub">
            ${t?"Default security mode.":`Default: ${n.security}.`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>Mode</span>
            <select
              ?disabled=${e.disabled}
              @change=${b=>{const $=b.target.value;!t&&$==="__default__"?e.onRemove([...s,"security"]):e.onPatch([...s,"security"],$)}}
            >
              ${t?f:o`<option value="__default__" ?selected=${d==="__default__"}>
                    Use default (${n.security})
                  </option>`}
              ${Qn.map(b=>o`<option
                    value=${b.value}
                    ?selected=${d===b.value}
                  >
                    ${b.label}
                  </option>`)}
            </select>
          </label>
        </div>
      </div>

      <div class="list-item">
        <div class="list-main">
          <div class="list-title">Ask</div>
          <div class="list-sub">
            ${t?"Default prompt policy.":`Default: ${n.ask}.`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>Mode</span>
            <select
              ?disabled=${e.disabled}
              @change=${b=>{const $=b.target.value;!t&&$==="__default__"?e.onRemove([...s,"ask"]):e.onPatch([...s,"ask"],$)}}
            >
              ${t?f:o`<option value="__default__" ?selected=${g==="__default__"}>
                    Use default (${n.ask})
                  </option>`}
              ${_d.map(b=>o`<option
                    value=${b.value}
                    ?selected=${g===b.value}
                  >
                    ${b.label}
                  </option>`)}
            </select>
          </label>
        </div>
      </div>

      <div class="list-item">
        <div class="list-main">
          <div class="list-title">Ask fallback</div>
          <div class="list-sub">
            ${t?"Applied when the UI prompt is unavailable.":`Default: ${n.askFallback}.`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>Fallback</span>
            <select
              ?disabled=${e.disabled}
              @change=${b=>{const $=b.target.value;!t&&$==="__default__"?e.onRemove([...s,"askFallback"]):e.onPatch([...s,"askFallback"],$)}}
            >
              ${t?f:o`<option value="__default__" ?selected=${p==="__default__"}>
                    Use default (${n.askFallback})
                  </option>`}
              ${Qn.map(b=>o`<option
                    value=${b.value}
                    ?selected=${p===b.value}
                  >
                    ${b.label}
                  </option>`)}
            </select>
          </label>
        </div>
      </div>

      <div class="list-item">
        <div class="list-main">
          <div class="list-title">Auto-allow skill CLIs</div>
          <div class="list-sub">
            ${t?"Allow skill executables listed by the Gateway.":u?`Using default (${n.autoAllowSkills?"on":"off"}).`:`Override (${c?"on":"off"}).`}
          </div>
        </div>
        <div class="list-meta">
          <label class="field">
            <span>Enabled</span>
            <input
              type="checkbox"
              ?disabled=${e.disabled}
              .checked=${c}
              @change=${b=>{const w=b.target;e.onPatch([...s,"autoAllowSkills"],w.checked)}}
            />
          </label>
          ${!t&&!u?o`<button
                class="btn btn--sm"
                ?disabled=${e.disabled}
                @click=${()=>e.onRemove([...s,"autoAllowSkills"])}
              >
                Use default
              </button>`:f}
        </div>
      </div>
    </div>
  `}function jd(e){const t=["agents",e.selectedScope,"allowlist"],n=e.allowlist;return o`
    <div class="row" style="margin-top: 18px; justify-content: space-between;">
      <div>
        <div class="card-title">Allowlist</div>
        <div class="card-sub">Case-insensitive glob patterns.</div>
      </div>
      <button
        class="btn btn--sm"
        ?disabled=${e.disabled}
        @click=${()=>{const i=[...n,{pattern:""}];e.onPatch(t,i)}}
      >
        Add pattern
      </button>
    </div>
    <div class="list" style="margin-top: 12px;">
      ${n.length===0?o`
              <div class="muted">No allowlist entries yet.</div>
            `:n.map((i,s)=>Hd(e,i,s))}
    </div>
  `}function Hd(e,t,n){const i=t.lastUsedAt?T(t.lastUsedAt):"never",s=t.lastUsedCommand?yt(t.lastUsedCommand,120):null,a=t.lastResolvedPath?yt(t.lastResolvedPath,120):null;return o`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${t.pattern?.trim()?t.pattern:"New pattern"}</div>
        <div class="list-sub">Last used: ${i}</div>
        ${s?o`<div class="list-sub mono">${s}</div>`:f}
        ${a?o`<div class="list-sub mono">${a}</div>`:f}
      </div>
      <div class="list-meta">
        <label class="field">
          <span>Pattern</span>
          <input
            type="text"
            .value=${t.pattern??""}
            ?disabled=${e.disabled}
            @input=${l=>{const r=l.target;e.onPatch(["agents",e.selectedScope,"allowlist",n,"pattern"],r.value)}}
          />
        </label>
        <button
          class="btn btn--sm danger"
          ?disabled=${e.disabled}
          @click=${()=>{if(e.allowlist.length<=1){e.onRemove(["agents",e.selectedScope,"allowlist"]);return}e.onRemove(["agents",e.selectedScope,"allowlist",n])}}
        >
          Remove
        </button>
      </div>
    </div>
  `}function zd(e,t){const n=e.binding??"__default__",i=e.name?.trim()?`${e.name} (${e.id})`:e.id,s=t.nodes.length>0;return o`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${i}</div>
        <div class="list-sub">
          ${e.isDefault?"default agent":"agent"} ·
          ${n==="__default__"?`uses default (${t.defaultBinding??"any"})`:`override: ${e.binding}`}
        </div>
      </div>
      <div class="list-meta">
        <label class="field">
          <span>Binding</span>
          <select
            ?disabled=${t.disabled||!s}
            @change=${a=>{const r=a.target.value.trim();t.onBindAgent(e.index,r==="__default__"?null:r)}}
          >
            <option value="__default__" ?selected=${n==="__default__"}>
              Use default
            </option>
            ${t.nodes.map(a=>o`<option
                  value=${a.id}
                  ?selected=${n===a.id}
                >
                  ${a.label}
                </option>`)}
          </select>
        </label>
      </div>
    </div>
  `}function Vd(e){const t=[];for(const n of e){if(!(Array.isArray(n.commands)?n.commands:[]).some(r=>String(r)==="system.run"))continue;const a=typeof n.nodeId=="string"?n.nodeId.trim():"";if(!a)continue;const l=typeof n.displayName=="string"&&n.displayName.trim()?n.displayName.trim():a;t.push({id:a,label:l===a?a:`${l} · ${a}`})}return t.sort((n,i)=>n.label.localeCompare(i.label)),t}function qd(e){const t=[];for(const n of e){if(!(Array.isArray(n.commands)?n.commands:[]).some(r=>String(r)==="system.execApprovals.get"||String(r)==="system.execApprovals.set"))continue;const a=typeof n.nodeId=="string"?n.nodeId.trim():"";if(!a)continue;const l=typeof n.displayName=="string"&&n.displayName.trim()?n.displayName.trim():a;t.push({id:a,label:l===a?a:`${l} · ${a}`})}return t.sort((n,i)=>n.label.localeCompare(i.label)),t}function Gd(e){const t={id:"main",name:void 0,index:0,isDefault:!0,binding:null};if(!e||typeof e!="object")return{defaultBinding:null,agents:[t]};const i=(e.tools??{}).exec??{},s=typeof i.node=="string"&&i.node.trim()?i.node.trim():null,a=e.agents??{},l=Array.isArray(a.list)?a.list:[];if(l.length===0)return{defaultBinding:s,agents:[t]};const r=[];return l.forEach((d,g)=>{if(!d||typeof d!="object")return;const p=d,v=typeof p.id=="string"?p.id.trim():"";if(!v)return;const c=typeof p.name=="string"?p.name.trim():void 0,u=p.default===!0,w=(p.tools??{}).exec??{},$=typeof w.node=="string"&&w.node.trim()?w.node.trim():null;r.push({id:v,name:c||void 0,index:g,isDefault:u,binding:$})}),r.length===0&&r.push(t),{defaultBinding:s,agents:r}}function Wd(e){const t=!!e.connected,n=!!e.paired,i=typeof e.displayName=="string"&&e.displayName.trim()||(typeof e.nodeId=="string"?e.nodeId:"unknown"),s=Array.isArray(e.caps)?e.caps:[],a=Array.isArray(e.commands)?e.commands:[];return o`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${i}</div>
        <div class="list-sub">
          ${typeof e.nodeId=="string"?e.nodeId:""}
          ${typeof e.remoteIp=="string"?` · ${e.remoteIp}`:""}
          ${typeof e.version=="string"?` · ${e.version}`:""}
        </div>
        <div class="chip-row" style="margin-top: 6px;">
          <span class="chip">${n?"paired":"unpaired"}</span>
          <span class="chip ${t?"chip-ok":"chip-warn"}">
            ${t?"connected":"offline"}
          </span>
          ${s.slice(0,12).map(l=>o`<span class="chip">${String(l)}</span>`)}
          ${a.slice(0,8).map(l=>o`<span class="chip">${String(l)}</span>`)}
        </div>
      </div>
    </div>
  `}function Yd(e){const t=e.hello?.snapshot,n=t?.uptimeMs?vi(t.uptimeMs):"n/a",i=t?.policy?.tickIntervalMs?`${t.policy.tickIntervalMs}ms`:"n/a",s=(()=>{if(e.connected||!e.lastError)return null;const l=e.lastError.toLowerCase();if(!(l.includes("unauthorized")||l.includes("connect failed")))return null;const d=!!e.settings.token.trim(),g=!!e.password.trim();return!d&&!g?o`
        <div class="muted" style="margin-top: 8px">
          This gateway requires auth. Add a token or password, then click Connect.
          <div style="margin-top: 6px">
            <span class="mono">openclaw dashboard --no-open</span> → tokenized URL<br />
            <span class="mono">openclaw doctor --generate-gateway-token</span> → set token
          </div>
          <div style="margin-top: 6px">
            <a
              class="session-link"
              href="https://docs.openclaw.ai/web/dashboard"
              target="_blank"
              rel="noreferrer"
              title="Control UI auth docs (opens in new tab)"
              >Docs: Control UI auth</a
            >
          </div>
        </div>
      `:o`
      <div class="muted" style="margin-top: 8px">
        Auth failed. Re-copy a tokenized URL with
        <span class="mono">openclaw dashboard --no-open</span>, or update the token, then click Connect.
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/dashboard"
            target="_blank"
            rel="noreferrer"
            title="Control UI auth docs (opens in new tab)"
            >Docs: Control UI auth</a
          >
        </div>
      </div>
    `})(),a=(()=>{if(e.connected||!e.lastError||(typeof window<"u"?window.isSecureContext:!0))return null;const r=e.lastError.toLowerCase();return!r.includes("secure context")&&!r.includes("device identity required")?null:o`
      <div class="muted" style="margin-top: 8px">
        This page is HTTP, so the browser blocks device identity. Use HTTPS (Tailscale Serve) or open
        <span class="mono">http://127.0.0.1:18789</span> on the gateway host.
        <div style="margin-top: 6px">
          If you must stay on HTTP, set
          <span class="mono">gateway.controlUi.allowInsecureAuth: true</span> (token-only).
        </div>
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/gateway/tailscale"
            target="_blank"
            rel="noreferrer"
            title="Tailscale Serve docs (opens in new tab)"
            >Docs: Tailscale Serve</a
          >
          <span class="muted"> · </span>
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/control-ui#insecure-http"
            target="_blank"
            rel="noreferrer"
            title="Insecure HTTP docs (opens in new tab)"
            >Docs: Insecure HTTP</a
          >
        </div>
      </div>
    `})();return o`
    <section class="grid grid-cols-2">
      <div class="card">
        <div class="card-title">Gateway Access</div>
        <div class="card-sub">Where the dashboard connects and how it authenticates.</div>
        <div class="form-grid" style="margin-top: 16px;">
          <label class="field">
            <span>WebSocket URL</span>
            <input
              .value=${e.settings.gatewayUrl}
              @input=${l=>{const r=l.target.value;e.onSettingsChange({...e.settings,gatewayUrl:r})}}
              placeholder="ws://100.x.y.z:18789"
            />
          </label>
          <label class="field">
            <span>Gateway Token</span>
            <input
              .value=${e.settings.token}
              @input=${l=>{const r=l.target.value;e.onSettingsChange({...e.settings,token:r})}}
              placeholder="OPENCLAW_GATEWAY_TOKEN"
            />
          </label>
          <label class="field">
            <span>Password (not stored)</span>
            <input
              type="password"
              .value=${e.password}
              @input=${l=>{const r=l.target.value;e.onPasswordChange(r)}}
              placeholder="system or shared password"
            />
          </label>
          <label class="field">
            <span>Default Session Key</span>
            <input
              .value=${e.settings.sessionKey}
              @input=${l=>{const r=l.target.value;e.onSessionKeyChange(r)}}
            />
          </label>
        </div>
        <div class="row" style="margin-top: 14px;">
          <button class="btn" @click=${()=>e.onConnect()}>Connect</button>
          <button class="btn" @click=${()=>e.onRefresh()}>Refresh</button>
          <span class="muted">Click Connect to apply connection changes.</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Snapshot</div>
        <div class="card-sub">Latest gateway handshake information.</div>
        <div class="stat-grid" style="margin-top: 16px;">
          <div class="stat">
            <div class="stat-label">Status</div>
            <div class="stat-value ${e.connected?"ok":"warn"}">
              ${e.connected?"Connected":"Disconnected"}
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">Uptime</div>
            <div class="stat-value">${n}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Tick Interval</div>
            <div class="stat-value">${i}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Last Channels Refresh</div>
            <div class="stat-value">
              ${e.lastChannelsRefresh?T(e.lastChannelsRefresh):"n/a"}
            </div>
          </div>
        </div>
        ${e.lastError?o`<div class="callout danger" style="margin-top: 14px;">
              <div>${e.lastError}</div>
              ${s??""}
              ${a??""}
            </div>`:o`
                <div class="callout" style="margin-top: 14px">
                  Use Channels to link WhatsApp, Telegram, Discord, Signal, or iMessage.
                </div>
              `}
      </div>
    </section>

    <section class="grid grid-cols-3" style="margin-top: 18px;">
      <div class="card stat-card">
        <div class="stat-label">Instances</div>
        <div class="stat-value">${e.presenceCount}</div>
        <div class="muted">Presence beacons in the last 5 minutes.</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Sessions</div>
        <div class="stat-value">${e.sessionsCount??"n/a"}</div>
        <div class="muted">Recent session keys tracked by the gateway.</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Cron</div>
        <div class="stat-value">
          ${e.cronEnabled==null?"n/a":e.cronEnabled?"Enabled":"Disabled"}
        </div>
        <div class="muted">Next wake ${Xt(e.cronNext)}</div>
      </div>
    </section>

    <section class="card" style="margin-top: 18px;">
      <div class="card-title">Notes</div>
      <div class="card-sub">Quick reminders for remote control setups.</div>
      <div class="note-grid" style="margin-top: 14px;">
        <div>
          <div class="note-title">Tailscale serve</div>
          <div class="muted">
            Prefer serve mode to keep the gateway on loopback with tailnet auth.
          </div>
        </div>
        <div>
          <div class="note-title">Session hygiene</div>
          <div class="muted">Use /new or sessions.patch to reset context.</div>
        </div>
        <div>
          <div class="note-title">Cron reminders</div>
          <div class="muted">Use isolated sessions for recurring runs.</div>
        </div>
      </div>
    </section>
  `}const Qd=["","off","minimal","low","medium","high"],Jd=["","off","on"],Xd=[{value:"",label:"inherit"},{value:"off",label:"off (explicit)"},{value:"on",label:"on"}],Zd=["","off","on","stream"];function eu(e){if(!e)return"";const t=e.trim().toLowerCase();return t==="z.ai"||t==="z-ai"?"zai":t}function bs(e){return eu(e)==="zai"}function tu(e){return bs(e)?Jd:Qd}function nu(e,t){return!t||!e||e==="off"?e:"on"}function iu(e,t){return e?t&&e==="on"?"low":e:null}function su(e,t){return t?[e.key,e.label??"",e.kind,e.displayName??""].filter(Boolean).join(" ").toLowerCase().includes(t.toLowerCase()):!0}function au(e){const t=e.result?.sessions??[],n=e.filterText.trim(),i=n?t.filter(s=>su(s,n)):t;return o`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Sessions</div>
          <div class="card-sub">Active session keys and per-session overrides.</div>
        </div>
        <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh} aria-label="Refresh sessions">
          ${e.loading?"Loading…":"Refresh"}
        </button>
      </div>

      <div class="filters" style="margin-top: 14px;">
        <label class="field" style="flex: 1;">
          <span>Search</span>
          <input
            type="search"
            .value=${e.filterText}
            @input=${s=>e.onFiltersChange({activeMinutes:e.activeMinutes,limit:e.limit,includeGlobal:e.includeGlobal,includeUnknown:e.includeUnknown,filterText:s.target.value})}
            placeholder="Filter by key, label, or kind"
            aria-label="Search sessions"
          />
        </label>
        <label class="field">
          <span>Active within (minutes)</span>
          <input
            .value=${e.activeMinutes}
            @input=${s=>e.onFiltersChange({activeMinutes:s.target.value,limit:e.limit,includeGlobal:e.includeGlobal,includeUnknown:e.includeUnknown,filterText:e.filterText})}
          />
        </label>
        <label class="field">
          <span>Limit</span>
          <input
            .value=${e.limit}
            @input=${s=>e.onFiltersChange({activeMinutes:e.activeMinutes,limit:s.target.value,includeGlobal:e.includeGlobal,includeUnknown:e.includeUnknown,filterText:e.filterText})}
          />
        </label>
        <label class="field checkbox">
          <span>Include global</span>
          <input
            type="checkbox"
            .checked=${e.includeGlobal}
            @change=${s=>e.onFiltersChange({activeMinutes:e.activeMinutes,limit:e.limit,includeGlobal:s.target.checked,includeUnknown:e.includeUnknown,filterText:e.filterText})}
          />
        </label>
        <label class="field checkbox">
          <span>Include unknown</span>
          <input
            type="checkbox"
            .checked=${e.includeUnknown}
            @change=${s=>e.onFiltersChange({activeMinutes:e.activeMinutes,limit:e.limit,includeGlobal:e.includeGlobal,includeUnknown:s.target.checked,filterText:e.filterText})}
          />
        </label>
      </div>

      ${e.error?o`<div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:f}

      <div class="muted" style="margin-top: 12px;">
        ${e.result?`Store: ${e.result.path}`:""}
        ${n?o` · ${i.length} of ${t.length} shown`:""}
      </div>

      <div class="table" style="margin-top: 16px;">
        <div class="table-head">
          <div>Key</div>
          <div>Label</div>
          <div>Kind</div>
          <div>Updated</div>
          <div>Tokens</div>
          <div>Thinking</div>
          <div>Verbose</div>
          <div>Reasoning</div>
          <div>Actions</div>
        </div>
        ${i.length===0?o`
                <div class="muted">No sessions found${n?" matching filter":""}.</div>
              `:i.map(s=>ou(s,e.basePath,e.onPatch,e.onDelete,e.loading))}
      </div>
    </section>
  `}function ou(e,t,n,i,s){const a=e.updatedAt?T(e.updatedAt):"n/a",l=e.thinkingLevel??"",r=bs(e.modelProvider),d=nu(l,r),g=tu(e.modelProvider),p=e.verboseLevel??"",v=e.reasoningLevel??"",c=e.displayName??e.key,u=e.kind!=="global",b=u?`${Wt("chat",t)}?session=${encodeURIComponent(e.key)}`:null;return o`
    <div class="table-row">
      <div class="mono">${u?o`<a href=${b} class="session-link">${c}</a>`:c}</div>
      <div>
        <input
          .value=${e.label??""}
          ?disabled=${s}
          placeholder="(optional)"
          @change=${w=>{const $=w.target.value.trim();n(e.key,{label:$||null})}}
        />
      </div>
      <div>${e.kind}</div>
      <div>${a}</div>
      <div>${Hl(e)}</div>
      <div>
        <select
          .value=${d}
          ?disabled=${s}
          @change=${w=>{const $=w.target.value;n(e.key,{thinkingLevel:iu($,r)})}}
        >
          ${g.map(w=>o`<option value=${w}>${w||"inherit"}</option>`)}
        </select>
      </div>
      <div>
        <select
          .value=${p}
          ?disabled=${s}
          @change=${w=>{const $=w.target.value;n(e.key,{verboseLevel:$||null})}}
        >
          ${Xd.map(w=>o`<option value=${w.value}>${w.label}</option>`)}
        </select>
      </div>
      <div>
        <select
          .value=${v}
          ?disabled=${s}
          @change=${w=>{const $=w.target.value;n(e.key,{reasoningLevel:$||null})}}
        >
          ${Zd.map(w=>o`<option value=${w}>${w||"inherit"}</option>`)}
        </select>
      </div>
      <div>
        <button class="btn danger" ?disabled=${s} @click=${()=>i(e.key)}>
          Delete
        </button>
      </div>
    </div>
  `}const ft=[{id:"workspace",label:"Workspace Skills",sources:["openclaw-workspace"]},{id:"built-in",label:"Built-in Skills",sources:["openclaw-bundled"]},{id:"installed",label:"Installed Skills",sources:["openclaw-managed"]},{id:"extra",label:"Extra Skills",sources:["openclaw-extra"]}];function lu(e){const t=new Map;for(const s of ft)t.set(s.id,{id:s.id,label:s.label,skills:[]});const n={id:"other",label:"Other Skills",skills:[]};for(const s of e){const a=ft.find(l=>l.sources.includes(s.source));a?t.get(a.id)?.skills.push(s):n.skills.push(s)}const i=ft.map(s=>t.get(s.id)).filter(s=>!!(s&&s.skills.length>0));return n.skills.length>0&&i.push(n),i}function ru(e){const t=e.report?.skills??[],n=e.filter.trim().toLowerCase(),i=n?t.filter(a=>[a.name,a.description,a.source].join(" ").toLowerCase().includes(n)):t,s=lu(i);return o`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">Skills</div>
          <div class="card-sub">Bundled, managed, and workspace skills.</div>
        </div>
        <button class="btn" ?disabled=${e.loading} @click=${e.onRefresh}>
          ${e.loading?"Loading…":"Refresh"}
        </button>
      </div>

      <div class="filters" style="margin-top: 14px;">
        <label class="field" style="flex: 1;">
          <span>Filter</span>
          <input
            .value=${e.filter}
            @input=${a=>e.onFilterChange(a.target.value)}
            placeholder="Search skills"
          />
        </label>
        <div class="muted">${i.length} shown</div>
      </div>

      ${e.error?o`<div class="callout danger" style="margin-top: 12px;">${e.error}</div>`:f}

      ${i.length===0?o`
              <div class="muted" style="margin-top: 16px">No skills found.</div>
            `:o`
            <div class="agent-skills-groups" style="margin-top: 16px;">
              ${s.map(a=>{const l=a.id==="workspace"||a.id==="built-in";return o`
                  <details class="agent-skills-group" ?open=${!l}>
                    <summary class="agent-skills-header">
                      <span>${a.label}</span>
                      <span class="muted">${a.skills.length}</span>
                    </summary>
                    <div class="list skills-grid">
                      ${a.skills.map(r=>cu(r,e))}
                    </div>
                  </details>
                `})}
            </div>
          `}
    </section>
  `}function cu(e,t){const n=t.busyKey===e.skillKey,i=t.edits[e.skillKey]??"",s=t.messages[e.skillKey]??null,a=e.install.length>0&&e.missing.bins.length>0,l=[...e.missing.bins.map(d=>`bin:${d}`),...e.missing.env.map(d=>`env:${d}`),...e.missing.config.map(d=>`config:${d}`),...e.missing.os.map(d=>`os:${d}`)],r=[];return e.disabled&&r.push("disabled"),e.blockedByAllowlist&&r.push("blocked by allowlist"),o`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">
          ${e.emoji?`${e.emoji} `:""}${e.name}
        </div>
        <div class="list-sub">${yt(e.description,140)}</div>
        <div class="chip-row" style="margin-top: 6px;">
          <span class="chip">${e.source}</span>
          <span class="chip ${e.eligible?"chip-ok":"chip-warn"}">
            ${e.eligible?"eligible":"blocked"}
          </span>
          ${e.disabled?o`
                  <span class="chip chip-warn">disabled</span>
                `:f}
        </div>
        ${l.length>0?o`
              <div class="muted" style="margin-top: 6px;">
                Missing: ${l.join(", ")}
              </div>
            `:f}
        ${r.length>0?o`
              <div class="muted" style="margin-top: 6px;">
                Reason: ${r.join(", ")}
              </div>
            `:f}
      </div>
      <div class="list-meta">
        <div class="row" style="justify-content: flex-end; flex-wrap: wrap;">
          <button
            class="btn"
            ?disabled=${n}
            @click=${()=>t.onToggle(e.skillKey,e.disabled)}
          >
            ${e.disabled?"Enable":"Disable"}
          </button>
          ${a?o`<button
                class="btn"
                ?disabled=${n}
                @click=${()=>t.onInstall(e.skillKey,e.name,e.install[0].id)}
              >
                ${n?"Installing…":e.install[0].label}
              </button>`:f}
        </div>
        ${s?o`<div
              class="muted"
              style="margin-top: 8px; color: ${s.kind==="error"?"var(--danger-color, #d14343)":"var(--success-color, #0a7f5a)"};"
            >
              ${s.message}
            </div>`:f}
        ${e.primaryEnv?o`
              <div class="field" style="margin-top: 10px;">
                <span>API key</span>
                <input
                  type="password"
                  .value=${i}
                  @input=${d=>t.onEdit(e.skillKey,d.target.value)}
                />
              </div>
              <button
                class="btn primary"
                style="margin-top: 8px;"
                ?disabled=${n}
                @click=${()=>t.onSaveKey(e.skillKey)}
              >
                Save key
              </button>
            `:f}
      </div>
    </div>
  `}const du=/^data:/i,uu=/^https?:\/\//i;function gu(e){const t=e.agentsList?.agents??[],i=di(e.sessionKey)?.agentId??e.agentsList?.defaultId??"main",a=t.find(r=>r.id===i)?.identity,l=a?.avatarUrl??a?.avatar;if(l)return du.test(l)||uu.test(l)?l:a?.avatarUrl}function fu(e){const t=e.presenceEntries.length,n=e.sessionsResult?.count??null,i=e.cronStatus?.nextWakeAtMs??null,s=e.connected?null:"Disconnected from gateway.",a=e.tab==="chat",l=a&&(e.settings.chatFocusMode||e.onboarding),r=e.onboarding?!1:e.settings.chatShowThinking,d=gu(e),g=e.chatAvatarUrl??d??null,p=e.configForm??e.configSnapshot?.config,v=e.agentsSelectedId??e.agentsList?.defaultId??e.agentsList?.agents?.[0]?.id??null;return o`
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div class="toast-container" role="status" aria-live="polite" aria-atomic="false">
      ${e.toasts.map(c=>o`
          <div class="toast toast--${c.type}" role="alert">
            <span class="toast__message">${c.message}</span>
            <button
              class="toast__close"
              @click=${()=>e.dismissToast(c.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        `)}
    </div>
    <div class="shell ${a?"shell--chat":""} ${l?"shell--chat-focus":""} ${e.settings.navCollapsed?"shell--nav-collapsed":""} ${e.onboarding?"shell--onboarding":""}">
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="nav-collapse-toggle"
            @click=${()=>e.applySettings({...e.settings,navCollapsed:!e.settings.navCollapsed})}
            title="${e.settings.navCollapsed?"Expand sidebar":"Collapse sidebar"}"
            aria-label="${e.settings.navCollapsed?"Expand sidebar":"Collapse sidebar"}"
          >
            <span class="nav-collapse-toggle__icon">${M.menu}</span>
          </button>
          <div class="brand">
            <div class="brand-logo">
              <img src="/favicon.svg" alt="OpenClaw" />
            </div>
            <div class="brand-text">
              <div class="brand-title">OPENCLAW</div>
              <div class="brand-sub">Gateway Dashboard</div>
            </div>
          </div>
        </div>
        <div class="topbar-status">
          <div class="pill" title="${e.connected?"Connected to gateway":e.connectionState==="reconnecting"?"Reconnecting to gateway":"Disconnected from gateway"}">
            <span class="statusDot ${e.connectionState==="connected"?"ok":e.connectionState==="reconnecting"?"warn":""}"></span>
            <span>Health</span>
            <span class="mono">${e.connectionState==="connected"?"OK":e.connectionState==="reconnecting"?"Reconnecting":"Offline"}</span>
          </div>
          ${_l(e)}
        </div>
      </header>
      <aside class="nav ${e.settings.navCollapsed?"nav--collapsed":""}">
        ${Fe.map(c=>{const u=e.settings.navGroupsCollapsed[c.label]??!1,b=c.tabs.some(w=>w===e.tab);return o`
            <div class="nav-group ${u&&!b?"nav-group--collapsed":""}">
              <button
                class="nav-label"
                @click=${()=>{const w={...e.settings.navGroupsCollapsed};w[c.label]=!u,e.applySettings({...e.settings,navGroupsCollapsed:w})}}
                aria-expanded=${!u}
              >
                <span class="nav-label__text">${c.label}</span>
                <span class="nav-label__chevron">${u?"+":"−"}</span>
              </button>
              <div class="nav-group__items">
                ${c.tabs.map(w=>xl(e,w))}
              </div>
            </div>
          `})}
        <div class="nav-group nav-group--links">
          <div class="nav-label nav-label--static">
            <span class="nav-label__text">Resources</span>
          </div>
          <div class="nav-group__items">
            <a
              class="nav-item nav-item--external"
              href="https://docs.openclaw.ai"
              target="_blank"
              rel="noreferrer"
              title="Docs (opens in new tab)"
            >
              <span class="nav-item__icon" aria-hidden="true">${M.book}</span>
              <span class="nav-item__text">Docs</span>
            </a>
          </div>
        </div>
      </aside>
      <main id="main-content" class="content ${a?"content--chat":""}">
        <section class="content-header">
          <div>
            <h1 class="page-title">${be(e.tab)}</h1>
            <div class="page-sub">${oo(e.tab)}</div>
          </div>
          <div class="page-meta">
            ${e.lastError?o`<div class="pill danger">${e.lastError}</div>`:f}
            ${a?Al(e):f}
          </div>
        </section>

        ${e.tab==="overview"?Yd({connected:e.connected,hello:e.hello,settings:e.settings,password:e.password,lastError:e.lastError,presenceCount:t,sessionsCount:n,cronEnabled:e.cronStatus?.enabled??null,cronNext:i,lastChannelsRefresh:e.channelsLastSuccess,onSettingsChange:c=>e.applySettings(c),onPasswordChange:c=>e.password=c,onSessionKeyChange:c=>{e.sessionKey=c,e.chatMessage="",e.resetToolStream(),e.applySettings({...e.settings,sessionKey:c,lastActiveSessionKey:c}),e.loadAssistantIdentity()},onConnect:()=>e.connect(),onRefresh:()=>e.loadOverview()}):f}

        ${e.tab==="channels"?Wr({connected:e.connected,loading:e.channelsLoading,snapshot:e.channelsSnapshot,lastError:e.channelsError,lastSuccessAt:e.channelsLastSuccess,whatsappMessage:e.whatsappLoginMessage,whatsappQrDataUrl:e.whatsappLoginQrDataUrl,whatsappConnected:e.whatsappLoginConnected,whatsappBusy:e.whatsappBusy,configSchema:e.configSchema,configSchemaLoading:e.configSchemaLoading,configForm:e.configForm,configUiHints:e.configUiHints,configSaving:e.configSaving,configFormDirty:e.configFormDirty,nostrProfileFormState:e.nostrProfileFormState,nostrProfileAccountId:e.nostrProfileAccountId,onRefresh:c=>R(e,c),onWhatsAppStart:c=>e.handleWhatsAppStart(c),onWhatsAppWait:()=>e.handleWhatsAppWait(),onWhatsAppLogout:()=>e.handleWhatsAppLogout(),onConfigPatch:(c,u)=>P(e,c,u),onConfigSave:()=>e.handleChannelConfigSave(),onConfigReload:()=>e.handleChannelConfigReload(),onNostrProfileEdit:(c,u)=>e.handleNostrProfileEdit(c,u),onNostrProfileCancel:()=>e.handleNostrProfileCancel(),onNostrProfileFieldChange:(c,u)=>e.handleNostrProfileFieldChange(c,u),onNostrProfileSave:()=>e.handleNostrProfileSave(),onNostrProfileImport:()=>e.handleNostrProfileImport(),onNostrProfileToggleAdvanced:()=>e.handleNostrProfileToggleAdvanced()}):f}

        ${e.tab==="instances"?bd({loading:e.presenceLoading,entries:e.presenceEntries,lastError:e.presenceError,statusMessage:e.presenceStatus,onRefresh:()=>Gt(e)}):f}

        ${e.tab==="sessions"?au({loading:e.sessionsLoading,result:e.sessionsResult,error:e.sessionsError,activeMinutes:e.sessionsFilterActive,limit:e.sessionsFilterLimit,filterText:e.sessionsFilterText,includeGlobal:e.sessionsIncludeGlobal,includeUnknown:e.sessionsIncludeUnknown,basePath:e.basePath,onFiltersChange:c=>{e.sessionsFilterActive=c.activeMinutes,e.sessionsFilterLimit=c.limit,e.sessionsFilterText=c.filterText,e.sessionsIncludeGlobal=c.includeGlobal,e.sessionsIncludeUnknown=c.includeUnknown},onRefresh:()=>z(e),onPatch:(c,u)=>Xa(e,c,u),onDelete:c=>Za(e,c)}):f}

        ${e.tab==="cron"?ud({loading:e.cronLoading,status:e.cronStatus,jobs:e.cronJobs,error:e.cronError,busy:e.cronBusy,form:e.cronForm,channels:e.channelsSnapshot?.channelMeta?.length?e.channelsSnapshot.channelMeta.map(c=>c.id):e.channelsSnapshot?.channelOrder??[],channelLabels:e.channelsSnapshot?.channelLabels??{},channelMeta:e.channelsSnapshot?.channelMeta??[],runsJobId:e.cronRunsJobId,runs:e.cronRuns,onFormChange:c=>e.cronForm={...e.cronForm,...c},onRefresh:()=>e.loadCron(),onAdd:()=>ua(e),onToggle:(c,u)=>ga(e,c,u),onRun:c=>fa(e,c),onRemove:c=>va(e,c),onLoadRuns:c=>hi(e,c)}):f}

        ${e.tab==="agents"?Zl({loading:e.agentsLoading,error:e.agentsError,agentsList:e.agentsList,selectedAgentId:v,activePanel:e.agentsPanel,configForm:p,configLoading:e.configLoading,configSaving:e.configSaving,configDirty:e.configFormDirty,channelsLoading:e.channelsLoading,channelsError:e.channelsError,channelsSnapshot:e.channelsSnapshot,channelsLastSuccess:e.channelsLastSuccess,cronLoading:e.cronLoading,cronStatus:e.cronStatus,cronJobs:e.cronJobs,cronError:e.cronError,agentFilesLoading:e.agentFilesLoading,agentFilesError:e.agentFilesError,agentFilesList:e.agentFilesList,agentFileActive:e.agentFileActive,agentFileContents:e.agentFileContents,agentFileDrafts:e.agentFileDrafts,agentFileSaving:e.agentFileSaving,agentIdentityLoading:e.agentIdentityLoading,agentIdentityError:e.agentIdentityError,agentIdentityById:e.agentIdentityById,agentSkillsLoading:e.agentSkillsLoading,agentSkillsReport:e.agentSkillsReport,agentSkillsError:e.agentSkillsError,agentSkillsAgentId:e.agentSkillsAgentId,skillsFilter:e.skillsFilter,onRefresh:async()=>{await pe(e);const c=e.agentsList?.agents?.map(u=>u.id)??[];c.length>0&&fi(e,c)},onSelectAgent:c=>{e.agentsSelectedId!==c&&(e.agentsSelectedId=c,e.agentFilesList=null,e.agentFilesError=null,e.agentFilesLoading=!1,e.agentFileActive=null,e.agentFileContents={},e.agentFileDrafts={},e.agentSkillsReport=null,e.agentSkillsError=null,e.agentSkillsAgentId=null,gi(e,c),e.agentsPanel==="files"&&dt(e,c),e.agentsPanel==="skills"&&Ee(e,c))},onSelectPanel:c=>{e.agentsPanel=c,c==="files"&&v&&e.agentFilesList?.agentId!==v&&(e.agentFilesList=null,e.agentFilesError=null,e.agentFileActive=null,e.agentFileContents={},e.agentFileDrafts={},dt(e,v)),c==="skills"&&v&&Ee(e,v),c==="channels"&&R(e,!1),c==="cron"&&e.loadCron()},onLoadFiles:c=>dt(e,c),onSelectFile:c=>{e.agentFileActive=c,v&&Fl(e,v,c)},onFileDraftChange:(c,u)=>{e.agentFileDrafts={...e.agentFileDrafts,[c]:u}},onFileReset:c=>{const u=e.agentFileContents[c]??"";e.agentFileDrafts={...e.agentFileDrafts,[c]:u}},onFileSave:c=>{if(!v)return;const u=e.agentFileDrafts[c]??e.agentFileContents[c]??"";Rl(e,v,c,u)},onToolsProfileChange:(c,u,b)=>{if(!p)return;const w=p.agents?.list;if(!Array.isArray(w))return;const $=w.findIndex(k=>k&&typeof k=="object"&&"id"in k&&k.id===c);if($<0)return;const S=["agents","list",$,"tools"];u?P(e,[...S,"profile"],u):j(e,[...S,"profile"]),b&&j(e,[...S,"allow"])},onToolsOverridesChange:(c,u,b)=>{if(!p)return;const w=p.agents?.list;if(!Array.isArray(w))return;const $=w.findIndex(k=>k&&typeof k=="object"&&"id"in k&&k.id===c);if($<0)return;const S=["agents","list",$,"tools"];u.length>0?P(e,[...S,"alsoAllow"],u):j(e,[...S,"alsoAllow"]),b.length>0?P(e,[...S,"deny"],b):j(e,[...S,"deny"])},onConfigReload:()=>N(e),onConfigSave:()=>Te(e),onChannelsRefresh:()=>R(e,!1),onCronRefresh:()=>e.loadCron(),onSkillsFilterChange:c=>e.skillsFilter=c,onSkillsRefresh:()=>{v&&Ee(e,v)},onAgentSkillToggle:(c,u,b)=>{if(!p)return;const w=p.agents?.list;if(!Array.isArray(w))return;const $=w.findIndex(_=>_&&typeof _=="object"&&"id"in _&&_.id===c);if($<0)return;const S=w[$],k=u.trim();if(!k)return;const C=e.agentSkillsReport?.skills?.map(_=>_.name).filter(Boolean)??[],I=(Array.isArray(S.skills)?S.skills.map(_=>String(_).trim()).filter(Boolean):void 0)??C,x=new Set(I);b?x.add(k):x.delete(k),P(e,["agents","list",$,"skills"],[...x])},onAgentSkillsClear:c=>{if(!p)return;const u=p.agents?.list;if(!Array.isArray(u))return;const b=u.findIndex(w=>w&&typeof w=="object"&&"id"in w&&w.id===c);b<0||j(e,["agents","list",b,"skills"])},onAgentSkillsDisableAll:c=>{if(!p)return;const u=p.agents?.list;if(!Array.isArray(u))return;const b=u.findIndex(w=>w&&typeof w=="object"&&"id"in w&&w.id===c);b<0||P(e,["agents","list",b,"skills"],[])},onModelChange:(c,u)=>{if(!p)return;const b=p.agents?.list;if(!Array.isArray(b))return;const w=b.findIndex(C=>C&&typeof C=="object"&&"id"in C&&C.id===c);if(w<0)return;const $=["agents","list",w,"model"];if(!u){j(e,$);return}const k=b[w]?.model;if(k&&typeof k=="object"&&!Array.isArray(k)){const C=k.fallbacks,L={primary:u,...Array.isArray(C)?{fallbacks:C}:{}};P(e,$,L)}else P(e,$,u)},onModelFallbacksChange:(c,u)=>{if(!p)return;const b=p.agents?.list;if(!Array.isArray(b))return;const w=b.findIndex(_=>_&&typeof _=="object"&&"id"in _&&_.id===c);if(w<0)return;const $=["agents","list",w,"model"],S=b[w],k=u.map(_=>_.trim()).filter(Boolean),C=S.model,I=(()=>{if(typeof C=="string")return C.trim()||null;if(C&&typeof C=="object"&&!Array.isArray(C)){const _=C.primary;if(typeof _=="string")return _.trim()||null}return null})();if(k.length===0){I?P(e,$,I):j(e,$);return}P(e,$,I?{primary:I,fallbacks:k}:{fallbacks:k})}}):f}

        ${e.tab==="skills"?ru({loading:e.skillsLoading,report:e.skillsReport,error:e.skillsError,filter:e.skillsFilter,edits:e.skillEdits,messages:e.skillMessages,busyKey:e.skillsBusyKey,onFilterChange:c=>e.skillsFilter=c,onRefresh:()=>se(e,{clearMessages:!0}),onToggle:(c,u)=>to(e,c,u),onEdit:(c,u)=>eo(e,c,u),onSaveKey:c=>no(e,c),onInstall:(c,u,b)=>io(e,c,u,b)}):f}

        ${e.tab==="nodes"?xd({loading:e.nodesLoading,nodes:e.nodes,devicesLoading:e.devicesLoading,devicesError:e.devicesError,devicesList:e.devicesList,configForm:e.configForm??e.configSnapshot?.config,configLoading:e.configLoading,configSaving:e.configSaving,configDirty:e.configFormDirty,configFormMode:e.configFormMode,execApprovalsLoading:e.execApprovalsLoading,execApprovalsSaving:e.execApprovalsSaving,execApprovalsDirty:e.execApprovalsDirty,execApprovalsSnapshot:e.execApprovalsSnapshot,execApprovalsForm:e.execApprovalsForm,execApprovalsSelectedAgent:e.execApprovalsSelectedAgent,execApprovalsTarget:e.execApprovalsTarget,execApprovalsTargetNodeId:e.execApprovalsTargetNodeId,onRefresh:()=>Ue(e),onDevicesRefresh:()=>J(e),onDeviceApprove:c=>ja(e,c),onDeviceReject:c=>Ha(e,c),onDeviceRotate:(c,u,b)=>za(e,{deviceId:c,role:u,scopes:b}),onDeviceRevoke:(c,u)=>Va(e,{deviceId:c,role:u}),onLoadConfig:()=>N(e),onLoadExecApprovals:()=>{const c=e.execApprovalsTarget==="node"&&e.execApprovalsTargetNodeId?{kind:"node",nodeId:e.execApprovalsTargetNodeId}:{kind:"gateway"};return qt(e,c)},onBindDefault:c=>{c?P(e,["tools","exec","node"],c):j(e,["tools","exec","node"])},onBindAgent:(c,u)=>{const b=["agents","list",c,"tools","exec","node"];u?P(e,b,u):j(e,b)},onSaveBindings:()=>Te(e),onExecApprovalsTargetChange:(c,u)=>{e.execApprovalsTarget=c,e.execApprovalsTargetNodeId=u,e.execApprovalsSnapshot=null,e.execApprovalsForm=null,e.execApprovalsDirty=!1,e.execApprovalsSelectedAgent=null},onExecApprovalsSelectAgent:c=>{e.execApprovalsSelectedAgent=c},onExecApprovalsPatch:(c,u)=>Qa(e,c,u),onExecApprovalsRemove:c=>Ja(e,c),onSaveExecApprovals:()=>{const c=e.execApprovalsTarget==="node"&&e.execApprovalsTargetNodeId?{kind:"node",nodeId:e.execApprovalsTargetNodeId}:{kind:"gateway"};return Ya(e,c)}}):f}

        ${e.tab==="chat"?nd({sessionKey:e.sessionKey,onSessionKeyChange:c=>{e.sessionKey=c,e.chatMessage="",e.chatAttachments=[],e.chatStream=null,e.chatStreamStartedAt=null,e.chatRunId=null,e.chatQueue=[],e.resetToolStream(),e.resetChatScroll(),e.applySettings({...e.settings,sessionKey:c,lastActiveSessionKey:c}),e.loadAssistantIdentity(),we(e),At(e)},thinkingLevel:e.chatThinkingLevel,showThinking:r,loading:e.chatLoading,sending:e.chatSending,compactionStatus:e.compactionStatus,assistantAvatarUrl:g,messages:e.chatMessages,toolMessages:e.chatToolMessages,stream:e.chatStream,streamStartedAt:e.chatStreamStartedAt,draft:e.chatMessage,queue:e.chatQueue,connected:e.connected,canSend:e.connected,disabledReason:s,error:e.lastError,sessions:e.sessionsResult,focusMode:l,onRefresh:()=>(e.resetToolStream(),Promise.all([we(e),At(e)])),onToggleFocusMode:()=>{e.onboarding||e.applySettings({...e.settings,chatFocusMode:!e.settings.chatFocusMode})},onChatScroll:c=>e.handleChatScroll(c),onDraftChange:c=>e.chatMessage=c,attachments:e.chatAttachments,onAttachmentsChange:c=>e.chatAttachments=c,onSend:()=>e.handleSendChat(),canAbort:!!e.chatRunId,onAbort:()=>{e.handleAbortChat()},onQueueRemove:c=>e.removeQueuedMessage(c),onNewSession:()=>e.handleSendChat("/new",{restoreDraft:!0}),showNewMessages:e.chatNewMessagesBelow,onScrollToBottom:()=>e.scrollToBottom(),sidebarOpen:e.sidebarOpen,sidebarContent:e.sidebarContent,sidebarError:e.sidebarError,splitRatio:e.splitRatio,onOpenSidebar:c=>e.handleOpenSidebar(c),onCloseSidebar:()=>e.handleCloseSidebar(),onSplitRatioChange:c=>e.handleSplitRatioChange(c),assistantName:e.assistantName,assistantAvatar:e.assistantAvatar}):f}

        ${e.tab==="config"?rd({raw:e.configRaw,originalRaw:e.configRawOriginal,valid:e.configValid,issues:e.configIssues,loading:e.configLoading,saving:e.configSaving,applying:e.configApplying,updating:e.updateRunning,connected:e.connected,schema:e.configSchema,schemaLoading:e.configSchemaLoading,uiHints:e.configUiHints,formMode:e.configFormMode,formValue:e.configForm,originalValue:e.configFormOriginal,searchQuery:e.configSearchQuery,activeSection:e.configActiveSection,activeSubsection:e.configActiveSubsection,onRawChange:c=>{e.configRaw=c},onFormModeChange:c=>e.configFormMode=c,onFormPatch:(c,u)=>P(e,c,u),onSearchChange:c=>e.configSearchQuery=c,onSectionChange:c=>{e.configActiveSection=c,e.configActiveSubsection=null},onSubsectionChange:c=>e.configActiveSubsection=c,onReload:()=>N(e),onSave:()=>Te(e),onApply:()=>Es(e),onUpdate:()=>Ms(e)}):f}

        ${e.tab==="debug"?pd({loading:e.debugLoading,status:e.debugStatus,health:e.debugHealth,models:e.debugModels,heartbeat:e.debugHeartbeat,eventLog:e.eventLog,callMethod:e.debugCallMethod,callParams:e.debugCallParams,callResult:e.debugCallResult,callError:e.debugCallError,onCallMethodChange:c=>e.debugCallMethod=c,onCallParamsChange:c=>e.debugCallParams=c,onRefresh:()=>Ke(e),onCall:()=>Xs(e)}):f}

        ${e.tab==="logs"?kd({loading:e.logsLoading,error:e.logsError,file:e.logsFile,entries:e.logsEntries,filterText:e.logsFilterText,levelFilters:e.logsLevelFilters,autoFollow:e.logsAutoFollow,truncated:e.logsTruncated,onFilterTextChange:c=>e.logsFilterText=c,onLevelToggle:(c,u)=>{e.logsLevelFilters={...e.logsLevelFilters,[c]:u}},onToggleAutoFollow:c=>e.logsAutoFollow=c,onRefresh:()=>ve(e,{reset:!0}),onExport:(c,u)=>e.exportLogs(c,u),onScroll:c=>e.handleLogsScroll(c)}):f}
      </main>
      ${md(e)}
      ${yd(e)}
      ${e.shortcutsHelpOpen?o`
              <div
                class="modal-overlay"
                @click=${()=>{e.shortcutsHelpOpen=!1,e.lastFocusedElement&&(e.lastFocusedElement.focus(),e.lastFocusedElement=null)}}
                @keydown=${c=>{c.key==="Escape"&&(e.shortcutsHelpOpen=!1,e.lastFocusedElement&&(e.lastFocusedElement.focus(),e.lastFocusedElement=null))}}
              >
                <div
                  class="modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="shortcuts-title"
                  @click=${c=>c.stopPropagation()}
                >
                  <div class="modal-header">
                    <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
                    <button
                      class="modal-close"
                      @click=${()=>{e.shortcutsHelpOpen=!1,e.lastFocusedElement&&(e.lastFocusedElement.focus(),e.lastFocusedElement=null)}}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <div class="modal-content">
                    <div class="shortcuts-list">
                      <div class="shortcut-item">
                        <kbd>Alt</kbd> + <kbd>1</kbd> - <kbd>9</kbd>
                        <span>Switch to tab by index</span>
                      </div>
                      <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>[</kbd> / <kbd>]</kbd>
                        <span>Previous / Next tab</span>
                      </div>
                      <div class="shortcut-item">
                        <kbd>R</kbd>
                        <span>Refresh current view</span>
                      </div>
                      <div class="shortcut-item">
                        <kbd>Esc</kbd>
                        <span>Close sidebar / modals</span>
                      </div>
                      <div class="shortcut-item">
                        <kbd>Ctrl</kbd> + <kbd>/</kbd> or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd>
                        <span>Focus search field</span>
                      </div>
                      <div class="shortcut-item">
                        <kbd>Shift</kbd> + <kbd>/</kbd>
                        <span>Show this help</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `:f}
      ${e.commandPaletteOpen?(()=>{const c=e.commandPaletteQuery.toLowerCase(),u=e.getCommandPaletteCommands(),b=c?u.filter($=>$.keywords.some(S=>S.toLowerCase().includes(c))||$.label.toLowerCase().includes(c)):u,w=0;return o`
                <div
                  class="modal-overlay"
                  @click=${()=>{e.commandPaletteOpen=!1,e.commandPaletteQuery="",e.lastFocusedElement&&(e.lastFocusedElement.focus(),e.lastFocusedElement=null)}}
                  @keydown=${$=>{$.key==="Escape"&&(e.commandPaletteOpen=!1,e.commandPaletteQuery="",e.lastFocusedElement&&(e.lastFocusedElement.focus(),e.lastFocusedElement=null))}}
                >
                  <div
                    class="modal modal--command-palette"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="palette-title"
                    @click=${$=>$.stopPropagation()}
                    @keydown=${$=>{$.key==="Enter"&&b.length>0&&($.preventDefault(),b[w]?.action())}}
                  >
                    <div class="modal-header">
                      <h2 id="palette-title">Command Palette</h2>
                      <button
                        class="modal-close"
                        @click=${()=>{e.commandPaletteOpen=!1,e.commandPaletteQuery="",e.lastFocusedElement&&(e.lastFocusedElement.focus(),e.lastFocusedElement=null)}}
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>
                    <div class="modal-content">
                      <input
                        type="text"
                        class="command-palette-input"
                        .value=${e.commandPaletteQuery}
                        @input=${$=>{e.commandPaletteQuery=$.target.value}}
                        placeholder="Type to search commands..."
                        autofocus
                        ${Oe($=>{$&&e.commandPaletteOpen&&$.focus()})}
                      />
                      <div class="command-palette-list" role="listbox">
                        ${b.length===0?o`
                                <div class="command-palette-empty">No commands found</div>
                              `:b.map(($,S)=>o`
                                  <button
                                    class="command-palette-item ${S===w?"command-palette-item--selected":""}"
                                    role="option"
                                    @click=${()=>$.action()}
                                  >
                                    <span class="command-palette-item__label">${$.label}</span>
                                  </button>
                                `)}
                      </div>
                    </div>
                  </div>
                </div>
              `})():f}
    </div>
  `}var vu=Object.defineProperty,pu=Object.getOwnPropertyDescriptor,m=(e,t,n,i)=>{for(var s=i>1?void 0:i?pu(t,n):t,a=e.length-1,l;a>=0;a--)(l=e[a])&&(s=(i?l(t,n,s):l(s))||s);return i&&s&&vu(t,n,s),s};const vt=al();function hu(){if(!window.location.search)return!1;const t=new URLSearchParams(window.location.search).get("onboarding");if(!t)return!1;const n=t.trim().toLowerCase();return n==="1"||n==="true"||n==="yes"||n==="on"}let h=class extends Xn{constructor(){super(...arguments),this.settings=lo(),this.password="",this.tab="chat",this.onboarding=hu(),this.connected=!1,this.connectionState="disconnected",this.theme=this.settings.theme??"system",this.themeResolved="dark",this.hello=null,this.lastError=null,this.eventLog=[],this.toasts=[],this.lastErrorToastId=null,this.errorToastDebounceTimer=null,this.toastTimers=new Map,this.eventLogBuffer=[],this.toolStreamSyncTimer=null,this.sidebarCloseTimer=null,this.assistantName=vt.name,this.assistantAvatar=vt.avatar,this.assistantAgentId=vt.agentId??null,this.sessionKey=this.settings.sessionKey,this.chatLoading=!1,this.chatSending=!1,this.chatMessage="",this.chatMessages=[],this.chatToolMessages=[],this.chatStream=null,this.chatStreamStartedAt=null,this.chatRunId=null,this.compactionStatus=null,this.chatAvatarUrl=null,this.chatThinkingLevel=null,this.chatQueue=[],this.chatAttachments=[],this.sidebarOpen=!1,this.sidebarContent=null,this.sidebarError=null,this.splitRatio=this.settings.splitRatio,this.nodesLoading=!1,this.nodes=[],this.devicesLoading=!1,this.devicesError=null,this.devicesList=null,this.execApprovalsLoading=!1,this.execApprovalsSaving=!1,this.execApprovalsDirty=!1,this.execApprovalsSnapshot=null,this.execApprovalsForm=null,this.execApprovalsSelectedAgent=null,this.execApprovalsTarget="gateway",this.execApprovalsTargetNodeId=null,this.execApprovalQueue=[],this.execApprovalBusy=!1,this.execApprovalError=null,this.pendingGatewayUrl=null,this.configLoading=!1,this.configRaw=`{
}
`,this.configRawOriginal="",this.configValid=null,this.configIssues=[],this.configSaving=!1,this.configApplying=!1,this.updateRunning=!1,this.applySessionKey=this.settings.lastActiveSessionKey,this.configSnapshot=null,this.configSchema=null,this.configSchemaVersion=null,this.configSchemaLoading=!1,this.configUiHints={},this.configForm=null,this.configFormOriginal=null,this.configFormDirty=!1,this.configFormMode="form",this.configSearchQuery="",this.configActiveSection=null,this.configActiveSubsection=null,this.channelsLoading=!1,this.channelsSnapshot=null,this.channelsError=null,this.channelsLastSuccess=null,this.whatsappLoginMessage=null,this.whatsappLoginQrDataUrl=null,this.whatsappLoginConnected=null,this.whatsappBusy=!1,this.nostrProfileFormState=null,this.nostrProfileAccountId=null,this.presenceLoading=!1,this.presenceEntries=[],this.presenceError=null,this.presenceStatus=null,this.agentsLoading=!1,this.agentsList=null,this.agentsError=null,this.agentsSelectedId=null,this.agentsPanel="overview",this.agentFilesLoading=!1,this.agentFilesError=null,this.agentFilesList=null,this.agentFileContents={},this.agentFileDrafts={},this.agentFileActive=null,this.agentFileSaving=!1,this.agentIdentityLoading=!1,this.agentIdentityError=null,this.agentIdentityById={},this.agentSkillsLoading=!1,this.agentSkillsError=null,this.agentSkillsReport=null,this.agentSkillsAgentId=null,this.sessionsLoading=!1,this.sessionsResult=null,this.sessionsError=null,this.sessionsFilterActive="",this.sessionsFilterLimit="120",this.sessionsFilterText="",this.sessionsIncludeGlobal=!0,this.sessionsIncludeUnknown=!1,this.cronLoading=!1,this.cronJobs=[],this.cronStatus=null,this.cronError=null,this.cronForm={...tl},this.cronRunsJobId=null,this.cronRuns=[],this.cronBusy=!1,this.skillsLoading=!1,this.skillsReport=null,this.skillsError=null,this.skillsFilter="",this.skillEdits={},this.skillsBusyKey=null,this.skillMessages={},this.debugLoading=!1,this.debugStatus=null,this.debugHealth=null,this.debugModels=[],this.debugHeartbeat=null,this.debugCallMethod="",this.debugCallParams="{}",this.debugCallResult=null,this.debugCallError=null,this.logsLoading=!1,this.logsError=null,this.logsFile=null,this.logsEntries=[],this.logsFilterText="",this.logsLevelFilters={...el},this.logsAutoFollow=!0,this.logsTruncated=!1,this.logsCursor=null,this.logsLastFetchAt=null,this.logsLimit=500,this.logsMaxBytes=25e4,this.logsAtBottom=!0,this.client=null,this.chatScrollFrame=null,this.chatScrollTimeout=null,this.chatHasAutoScrolled=!1,this.chatUserNearBottom=!0,this.chatNewMessagesBelow=!1,this.nodesPollInterval=null,this.logsPollInterval=null,this.debugPollInterval=null,this.logsScrollFrame=null,this.toolStreamById=new Map,this.toolStreamOrder=[],this.refreshSessionsAfterChat=new Set,this.basePath="",this.popStateHandler=()=>$o(this),this.themeMedia=null,this.themeMediaHandler=null,this.topbarObserver=null,this.keyboardHandler=null,this.lastFocusedElement=null,this.shortcutsHelpOpen=!1,this.commandPaletteOpen=!1,this.commandPaletteQuery=""}createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),hl(this),this.setupKeyboardShortcuts()}firstUpdated(){ml(this)}disconnectedCallback(){this.teardownKeyboardShortcuts(),yl(this),super.disconnectedCallback()}updated(e){if(bl(this,e),e.has("lastError")){const t=this.lastError;t&&t!==this.lastErrorToastId?(this.errorToastDebounceTimer!==null&&window.clearTimeout(this.errorToastDebounceTimer),this.errorToastDebounceTimer=window.setTimeout(()=>{this.lastErrorToastId=t,this.showToast("error",t),this.errorToastDebounceTimer=null},300)):t||(this.lastErrorToastId=null,this.errorToastDebounceTimer!==null&&(window.clearTimeout(this.errorToastDebounceTimer),this.errorToastDebounceTimer=null))}}connect(){Zi(this)}handleChatScroll(e){Ws(this,e)}handleLogsScroll(e){Ys(this,e)}exportLogs(e,t){Qs(e,t)}resetToolStream(){Ge(this)}resetChatScroll(){on(this)}scrollToBottom(){on(this),Se(this,!0)}async loadAssistantIdentity(){await Qi(this)}applySettings(e){Y(this,e)}setTab(e){vo(this,e)}setTheme(e,t){po(this,e,t)}async loadOverview(){await ji(this)}async loadCron(){await Be(this)}async handleAbortChat(){await qi(this)}removeQueuedMessage(e){Yo(this,e)}async handleSendChat(e,t){await Qo(this,e,t)}async handleWhatsAppStart(e){await Ns(this,e)}async handleWhatsAppWait(){await Bs(this)}async handleWhatsAppLogout(){await Ds(this)}async handleChannelConfigSave(){await Os(this)}async handleChannelConfigReload(){await Ks(this)}handleNostrProfileEdit(e,t){js(this,e,t)}handleNostrProfileCancel(){Hs(this)}handleNostrProfileFieldChange(e,t){zs(this,e,t)}async handleNostrProfileSave(){await qs(this)}async handleNostrProfileImport(){await Gs(this)}handleNostrProfileToggleAdvanced(){Vs(this)}async handleExecApprovalDecision(e){const t=this.execApprovalQueue[0];if(!(!t||!this.client||this.execApprovalBusy)){this.execApprovalBusy=!0,this.execApprovalError=null;try{await this.client.request("exec.approval.resolve",{id:t.id,decision:e}),this.execApprovalQueue=this.execApprovalQueue.filter(n=>n.id!==t.id)}catch(n){this.execApprovalError=`Exec approval failed: ${String(n)}`}finally{this.execApprovalBusy=!1}}}handleGatewayUrlConfirm(){const e=this.pendingGatewayUrl;e&&(this.pendingGatewayUrl=null,Y(this,{...this.settings,gatewayUrl:e}),this.connect())}handleGatewayUrlCancel(){this.pendingGatewayUrl=null}handleOpenSidebar(e){this.sidebarCloseTimer!=null&&(window.clearTimeout(this.sidebarCloseTimer),this.sidebarCloseTimer=null),this.sidebarContent=e,this.sidebarError=null,this.sidebarOpen=!0}handleCloseSidebar(){this.sidebarOpen=!1,this.sidebarCloseTimer!=null&&window.clearTimeout(this.sidebarCloseTimer),this.sidebarCloseTimer=window.setTimeout(()=>{this.sidebarOpen||(this.sidebarContent=null,this.sidebarError=null,this.sidebarCloseTimer=null)},200)}handleSplitRatioChange(e){const t=Math.max(.4,Math.min(.7,e));this.splitRatio=t,this.applySettings({...this.settings,splitRatio:t})}showToast(e,t){const n=generateUUID(),i=Date.now();if(this.toasts=[...this.toasts.slice(-2),{id:n,type:e,message:t,createdAt:i}],e==="success"){const s=window.setTimeout(()=>this.dismissToast(n),5e3);this.toastTimers.set(n,s)}else if(e==="error"){const s=window.setTimeout(()=>this.dismissToast(n),8e3);this.toastTimers.set(n,s)}}dismissToast(e){const t=this.toastTimers.get(e);t!==void 0&&(window.clearTimeout(t),this.toastTimers.delete(e)),this.toasts=this.toasts.filter(n=>n.id!==e)}setupKeyboardShortcuts(){this.keyboardHandler=e=>{const t=e.target;if(!(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable)){if(e.altKey&&!e.ctrlKey&&!e.shiftKey&&!e.metaKey){const n=parseInt(e.key,10);if(n>=1&&n<=9){e.preventDefault();const i=[];for(const a of Fe)i.push(...a.tabs);const s=n-1;s<i.length&&this.setTab(i[s]);return}}if(e.ctrlKey&&!e.altKey&&!e.shiftKey&&!e.metaKey&&(e.key==="["||e.key==="]")){e.preventDefault();const n=[];for(const l of Fe)n.push(...l.tabs);const i=n.indexOf(this.tab);if(i===-1)return;const s=e.key==="["?-1:1,a=(i+s+n.length)%n.length;this.setTab(n[a]);return}if(e.key==="r"&&!e.ctrlKey&&!e.altKey&&!e.shiftKey&&!e.metaKey){e.preventDefault(),this.tab==="overview"?this.loadOverview():this.tab==="channels"?R(this,!1):this.tab==="sessions"?z(this):this.tab==="logs"?ve(this):this.tab==="skills"?se(this):this.tab==="agents"?pe(this):this.tab==="config"&&N(this);return}if((e.ctrlKey||e.metaKey)&&e.shiftKey&&!e.altKey&&e.key==="K"){e.preventDefault(),this.commandPaletteOpen=!0,this.commandPaletteQuery="";return}if(e.key==="Escape"&&!e.ctrlKey&&!e.altKey&&!e.shiftKey&&!e.metaKey){if(this.commandPaletteOpen){e.preventDefault(),this.commandPaletteOpen=!1,this.commandPaletteQuery="",this.lastFocusedElement&&(this.lastFocusedElement.focus(),this.lastFocusedElement=null);return}if(this.shortcutsHelpOpen){e.preventDefault(),this.shortcutsHelpOpen=!1,this.lastFocusedElement&&(this.lastFocusedElement.focus(),this.lastFocusedElement=null);return}if(this.sidebarOpen){e.preventDefault(),this.handleCloseSidebar();return}return}if(e.ctrlKey&&!e.altKey&&!e.metaKey&&e.key==="/"||e.ctrlKey&&e.shiftKey&&!e.altKey&&!e.metaKey&&e.key==="F"){e.preventDefault();const n=document.querySelector('input[type="search"], input[placeholder*="Search"], input[placeholder*="Filter"]');n&&(n.focus(),n.select());return}if(e.shiftKey&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.key==="/"){e.preventDefault(),this.shortcutsHelpOpen||(this.lastFocusedElement=document.activeElement),this.shortcutsHelpOpen=!this.shortcutsHelpOpen;return}}},document.addEventListener("keydown",this.keyboardHandler)}teardownKeyboardShortcuts(){this.keyboardHandler&&(document.removeEventListener("keydown",this.keyboardHandler),this.keyboardHandler=null)}getCommandPaletteCommands(){const e=[];for(const n of Fe)e.push(...n.tabs);const t=[];for(const n of e)t.push({id:`tab-${n}`,label:`Go to ${be(n)}`,keywords:[n,be(n).toLowerCase()],action:()=>{this.setTab(n),this.commandPaletteOpen=!1}});return t.push({id:"refresh",label:"Refresh current view",keywords:["refresh","reload"],action:()=>{this.tab==="overview"?this.loadOverview():this.tab==="channels"?R(this,!1):this.tab==="sessions"?z(this):this.tab==="logs"?ve(this):this.tab==="skills"?se(this):this.tab==="agents"?pe(this):this.tab==="config"&&N(this),this.commandPaletteOpen=!1}}),t.push({id:"toggle-theme",label:`Switch to ${this.themeResolved==="dark"?"light":"dark"} theme`,keywords:["theme","dark","light","toggle"],action:()=>{this.setTheme(this.themeResolved==="dark"?"light":"dark"),this.commandPaletteOpen=!1}}),t.push({id:"toggle-focus",label:`${this.settings.chatFocusMode?"Disable":"Enable"} focus mode`,keywords:["focus","mode"],action:()=>{this.applySettings({...this.settings,chatFocusMode:!this.settings.chatFocusMode}),this.commandPaletteOpen=!1}}),this.tab==="chat"&&t.push({id:"new-session",label:"New chat session",keywords:["new","session","chat"],action:()=>{this.sessionKey=`session-${Date.now()}`,this.chatMessage="",this.resetToolStream(),this.applySettings({...this.settings,sessionKey:this.sessionKey,lastActiveSessionKey:this.sessionKey}),this.loadAssistantIdentity(),this.commandPaletteOpen=!1}}),t}render(){return fu(this)}};m([y()],h.prototype,"settings",2);m([y()],h.prototype,"password",2);m([y()],h.prototype,"tab",2);m([y()],h.prototype,"onboarding",2);m([y()],h.prototype,"connected",2);m([y()],h.prototype,"connectionState",2);m([y()],h.prototype,"theme",2);m([y()],h.prototype,"themeResolved",2);m([y()],h.prototype,"hello",2);m([y()],h.prototype,"lastError",2);m([y()],h.prototype,"eventLog",2);m([y()],h.prototype,"toasts",2);m([y()],h.prototype,"assistantName",2);m([y()],h.prototype,"assistantAvatar",2);m([y()],h.prototype,"assistantAgentId",2);m([y()],h.prototype,"sessionKey",2);m([y()],h.prototype,"chatLoading",2);m([y()],h.prototype,"chatSending",2);m([y()],h.prototype,"chatMessage",2);m([y()],h.prototype,"chatMessages",2);m([y()],h.prototype,"chatToolMessages",2);m([y()],h.prototype,"chatStream",2);m([y()],h.prototype,"chatStreamStartedAt",2);m([y()],h.prototype,"chatRunId",2);m([y()],h.prototype,"compactionStatus",2);m([y()],h.prototype,"chatAvatarUrl",2);m([y()],h.prototype,"chatThinkingLevel",2);m([y()],h.prototype,"chatQueue",2);m([y()],h.prototype,"chatAttachments",2);m([y()],h.prototype,"sidebarOpen",2);m([y()],h.prototype,"sidebarContent",2);m([y()],h.prototype,"sidebarError",2);m([y()],h.prototype,"splitRatio",2);m([y()],h.prototype,"nodesLoading",2);m([y()],h.prototype,"nodes",2);m([y()],h.prototype,"devicesLoading",2);m([y()],h.prototype,"devicesError",2);m([y()],h.prototype,"devicesList",2);m([y()],h.prototype,"execApprovalsLoading",2);m([y()],h.prototype,"execApprovalsSaving",2);m([y()],h.prototype,"execApprovalsDirty",2);m([y()],h.prototype,"execApprovalsSnapshot",2);m([y()],h.prototype,"execApprovalsForm",2);m([y()],h.prototype,"execApprovalsSelectedAgent",2);m([y()],h.prototype,"execApprovalsTarget",2);m([y()],h.prototype,"execApprovalsTargetNodeId",2);m([y()],h.prototype,"execApprovalQueue",2);m([y()],h.prototype,"execApprovalBusy",2);m([y()],h.prototype,"execApprovalError",2);m([y()],h.prototype,"pendingGatewayUrl",2);m([y()],h.prototype,"configLoading",2);m([y()],h.prototype,"configRaw",2);m([y()],h.prototype,"configRawOriginal",2);m([y()],h.prototype,"configValid",2);m([y()],h.prototype,"configIssues",2);m([y()],h.prototype,"configSaving",2);m([y()],h.prototype,"configApplying",2);m([y()],h.prototype,"updateRunning",2);m([y()],h.prototype,"applySessionKey",2);m([y()],h.prototype,"configSnapshot",2);m([y()],h.prototype,"configSchema",2);m([y()],h.prototype,"configSchemaVersion",2);m([y()],h.prototype,"configSchemaLoading",2);m([y()],h.prototype,"configUiHints",2);m([y()],h.prototype,"configForm",2);m([y()],h.prototype,"configFormOriginal",2);m([y()],h.prototype,"configFormDirty",2);m([y()],h.prototype,"configFormMode",2);m([y()],h.prototype,"configSearchQuery",2);m([y()],h.prototype,"configActiveSection",2);m([y()],h.prototype,"configActiveSubsection",2);m([y()],h.prototype,"channelsLoading",2);m([y()],h.prototype,"channelsSnapshot",2);m([y()],h.prototype,"channelsError",2);m([y()],h.prototype,"channelsLastSuccess",2);m([y()],h.prototype,"whatsappLoginMessage",2);m([y()],h.prototype,"whatsappLoginQrDataUrl",2);m([y()],h.prototype,"whatsappLoginConnected",2);m([y()],h.prototype,"whatsappBusy",2);m([y()],h.prototype,"nostrProfileFormState",2);m([y()],h.prototype,"nostrProfileAccountId",2);m([y()],h.prototype,"presenceLoading",2);m([y()],h.prototype,"presenceEntries",2);m([y()],h.prototype,"presenceError",2);m([y()],h.prototype,"presenceStatus",2);m([y()],h.prototype,"agentsLoading",2);m([y()],h.prototype,"agentsList",2);m([y()],h.prototype,"agentsError",2);m([y()],h.prototype,"agentsSelectedId",2);m([y()],h.prototype,"agentsPanel",2);m([y()],h.prototype,"agentFilesLoading",2);m([y()],h.prototype,"agentFilesError",2);m([y()],h.prototype,"agentFilesList",2);m([y()],h.prototype,"agentFileContents",2);m([y()],h.prototype,"agentFileDrafts",2);m([y()],h.prototype,"agentFileActive",2);m([y()],h.prototype,"agentFileSaving",2);m([y()],h.prototype,"agentIdentityLoading",2);m([y()],h.prototype,"agentIdentityError",2);m([y()],h.prototype,"agentIdentityById",2);m([y()],h.prototype,"agentSkillsLoading",2);m([y()],h.prototype,"agentSkillsError",2);m([y()],h.prototype,"agentSkillsReport",2);m([y()],h.prototype,"agentSkillsAgentId",2);m([y()],h.prototype,"sessionsLoading",2);m([y()],h.prototype,"sessionsResult",2);m([y()],h.prototype,"sessionsError",2);m([y()],h.prototype,"sessionsFilterActive",2);m([y()],h.prototype,"sessionsFilterLimit",2);m([y()],h.prototype,"sessionsFilterText",2);m([y()],h.prototype,"sessionsIncludeGlobal",2);m([y()],h.prototype,"sessionsIncludeUnknown",2);m([y()],h.prototype,"cronLoading",2);m([y()],h.prototype,"cronJobs",2);m([y()],h.prototype,"cronStatus",2);m([y()],h.prototype,"cronError",2);m([y()],h.prototype,"cronForm",2);m([y()],h.prototype,"cronRunsJobId",2);m([y()],h.prototype,"cronRuns",2);m([y()],h.prototype,"cronBusy",2);m([y()],h.prototype,"skillsLoading",2);m([y()],h.prototype,"skillsReport",2);m([y()],h.prototype,"skillsError",2);m([y()],h.prototype,"skillsFilter",2);m([y()],h.prototype,"skillEdits",2);m([y()],h.prototype,"skillsBusyKey",2);m([y()],h.prototype,"skillMessages",2);m([y()],h.prototype,"debugLoading",2);m([y()],h.prototype,"debugStatus",2);m([y()],h.prototype,"debugHealth",2);m([y()],h.prototype,"debugModels",2);m([y()],h.prototype,"debugHeartbeat",2);m([y()],h.prototype,"debugCallMethod",2);m([y()],h.prototype,"debugCallParams",2);m([y()],h.prototype,"debugCallResult",2);m([y()],h.prototype,"debugCallError",2);m([y()],h.prototype,"logsLoading",2);m([y()],h.prototype,"logsError",2);m([y()],h.prototype,"logsFile",2);m([y()],h.prototype,"logsEntries",2);m([y()],h.prototype,"logsFilterText",2);m([y()],h.prototype,"logsLevelFilters",2);m([y()],h.prototype,"logsAutoFollow",2);m([y()],h.prototype,"logsTruncated",2);m([y()],h.prototype,"logsCursor",2);m([y()],h.prototype,"logsLastFetchAt",2);m([y()],h.prototype,"logsLimit",2);m([y()],h.prototype,"logsMaxBytes",2);m([y()],h.prototype,"logsAtBottom",2);m([y()],h.prototype,"chatNewMessagesBelow",2);m([y()],h.prototype,"shortcutsHelpOpen",2);m([y()],h.prototype,"commandPaletteOpen",2);m([y()],h.prototype,"commandPaletteQuery",2);h=m([Zn("openclaw-app")],h);
//# sourceMappingURL=index-BuTyEdc0.js.map
