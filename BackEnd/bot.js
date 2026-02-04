require('dotenv').config();
const Discord = require('discord.js');
const WebSocket = require('ws');

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildModeration,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildMessages,      // ← NUEVO: Para leer mensajes
    Discord.GatewayIntentBits.MessageContent      // ← NUEVO: Para leer el contenido
  ]
});

const wss = new WebSocket.Server({ port: 8080 });
const webClients = new Set();

// Configuración de WebSocket 
wss.on('connection', (ws) => {
    webClients.add(ws);
    console.log('Nueva conexión WebSocket');

    // Manejar mensajes del frontend
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            await handleWebSocketMessage(ws, data);
        } catch (error) {
            console.error('Error procesando mensaje WebSocket:', error);
        }
    });

    ws.on('close', () => {
        webClients.delete(ws);
        console.log('Conexión WebSocket cerrada');
    });

    // Enviar estado inicial del bot
    if (client.isReady()) {
        ws.send(JSON.stringify({
            type: 'BOT_STATUS',
            data: {
                status: 'connected',
                botId: client.user.id,
                botTag: client.user.tag
            }
        }));
    }
});
/////FINAL.W.2
// Manejar mensajes del WebSocket
async function handleWebSocketMessage(ws, message) {
    const { type, serverId, serverIds } = message;

    switch (type) {
        case 'GET_SERVER_INFO':
            await handleGetServerInfo(ws, serverId);
            break;
        
        case 'GET_BOT_STATUS':
            await handleGetBotStatus(ws, serverIds);
            break;
        
        case 'CHECK_BOT_IN_GUILD':
            await handleCheckBotInGuild(ws, serverId);
            break;
            
        default:
            console.log('Tipo de mensaje no reconocido:', type);
    }
}
////////////FINAL.W.3///////////
// Verificar si el bot está en un servidor específico
async function handleCheckBotInGuild(ws, serverId) {
    try {
        const guild = client.guilds.cache.get(serverId);
        
        const response = {
            type: 'BOT_IN_GUILD_STATUS',
            data: {
                serverId: serverId,
                isInGuild: !!guild,
                guildInfo: guild ? {
                    name: guild.name,
                    memberCount: guild.memberCount,
                    icon: guild.iconURL()
                } : null
            }
        };

        ws.send(JSON.stringify(response));
    } catch (error) {
        console.error('Error verificando bot en guild:', error);
        ws.send(JSON.stringify({
            type: 'ERROR',
            data: { message: 'Error verificando bot en servidor' }
        }));
    }
}

///////////FINAL.W.4
// Obtener información de servidor
async function handleGetServerInfo(ws, serverId) {
    try {
        const guild = client.guilds.cache.get(serverId);
        
        if (!guild) {
            ws.send(JSON.stringify({
                type: 'SERVER_INFO',
                data: { serverId, found: false }
            }));
            return;
        }

    // Bot SÍ está - enviar info completa
        const response = {
            type: 'SERVER_INFO',
            data: {
                serverId: serverId,
                found: true,
                name: guild.name,
                memberCount: guild.memberCount,
                icon: guild.iconURL(),
                botPermissions: guild.members.me?.permissions.toArray() || []
            }
        };

        ws.send(JSON.stringify(response));
    } catch (error) {
        console.error('Error obteniendo info del servidor:', error);
    }
}

/////FINAL.W.5
// Verificar estado del bot en múltiples servidores
async function handleGetBotStatus(ws, serverIds) {
    try {
        const statusMap = {};
        
        for (const serverId of serverIds) {
            const guild = client.guilds.cache.get(serverId);
            if (guild) {
                const channels = guild.channels.cache;
                const roles = guild.roles.cache;
                
                statusMap[serverId] = {
                    isInGuild: true,
                    guildName: guild.name,
                    hasPermissions: guild.members.me?.permissions.has(Discord.PermissionFlagsBits.ViewAuditLog) || false,
                    memberCount: guild.memberCount,
                    channelCount: channels.size,
                    roleCount: roles.size - 1, // -1 para excluir @everyone
                    channels: {
                        text: channels.filter(c => c.type === 0).size,
                        voice: channels.filter(c => c.type === 2).size,
                        category: channels.filter(c => c.type === 4).size,
                        total: channels.size
                    }
                };
            } else {
                statusMap[serverId] = {
                    isInGuild: false,
                    guildName: null,
                    hasPermissions: false,
                    memberCount: 0,
                    channelCount: 0,
                    roleCount: 0
                };
            }
        }

        ws.send(JSON.stringify({
            type: 'BOT_STATUS_RESPONSE',
            data: statusMap
        }));
    } catch (error) {
        console.error('Error verificando estado del bot:', error);
    }
}

/////FINAL.W.6

// Eventos del bot
client.on('clientReady', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
    
    // Notificar a todos los clientes WebSocket que el bot está listo
    sendToAllClients(JSON.stringify({
        type: 'BOT_STATUS',
        data: {
            status: 'connected',
            botId: client.user.id,
            botTag: client.user.tag,
            guildCount: client.guilds.cache.size
        }
    }));
});

client.on('guildCreate', (guild) => {
    console.log(`Bot añadido a nuevo servidor: ${guild.name}`);
    
    sendToAllClients(JSON.stringify({
        type: 'BOT_JOINED_GUILD',
        data: {
            guildId: guild.id,
            guildName: guild.name,
            memberCount: guild.memberCount
        }
    }));
});

client.on('guildDelete', (guild) => {
    console.log(`Bot removido del servidor: ${guild.name}`);
    
    sendToAllClients(JSON.stringify({
        type: 'BOT_LEFT_GUILD',
        data: {
            guildId: guild.id,
            guildName: guild.name
        }
    }));
});

client.on('guildAuditLogEntryCreate', async (auditLogEntry, guild) => {
    try {
        const actionName = getActionName(auditLogEntry.action);
        const executor = await getExecutorInfo(auditLogEntry);
        const targetInfo = getTargetInfo(auditLogEntry, guild);

        const message = JSON.stringify({
            type: 'AUDIT_LOG',
            data: {
                serverName: guild.name,
                serverId: guild.id,
                action: actionName,
                actionCode: auditLogEntry.action,
                executor: executor,
                target: targetInfo,
                reason: auditLogEntry.reason || 'No especificada',
                timestamp: new Date().toISOString()
            }
        });

        sendToAllClients(message);
    } catch (error) {
        console.error('Error al procesar log de auditoría:', error);
    }
});
//SALUDO
client.on('messageCreate', async (message) => {
  // Ignorar mensajes del propio bot para evitar loops infinitos
  if (message.author.bot) return;
  
  // Verificar si el mensaje es el comando !saludo
  if (message.content.toLowerCase() === '!saludo') {
    try {
      // Responder en el mismo canal
      await message.reply('¡Hola! 👋');
      
      // Opcional: Log para debugging
      console.log(`Comando !saludo usado por ${message.author.tag} en ${message.guild.name}`);
    } catch (error) {
      console.error('Error al responder comando:', error);
    }
  }
});

// Funciones auxiliares existentes
async function getExecutorInfo(auditLogEntry) {
    if (auditLogEntry.executor) {
        return `${auditLogEntry.executor.tag} (${auditLogEntry.executor.id})`;
    }
    if (auditLogEntry.executorId) {
        const user = await client.users.fetch(auditLogEntry.executorId).catch(() => null);
        return user ? user.tag : `Usuario ID: ${auditLogEntry.executorId}`;
    }
    return 'Sistema de Discord';
}

function getTargetInfo(auditLogEntry, guild) {
    if ([10, 11, 12].includes(auditLogEntry.action)) {
        const channel = guild.channels.cache.get(auditLogEntry.targetId);
        return channel ? `#${channel.name} (${channel.id})` : `Canal eliminado (${auditLogEntry.targetId})`;
    }
    return auditLogEntry.targetId;
}

function sendToAllClients(message) {
    webClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function getActionName(actionCode) {
    const actions = {
        10: 'CREAR CANAL', 11: 'ACTUALIZAR CANAL', 12: 'ELIMINAR CANAL',
        20: 'EXPULSAR MIEMBRO', 21: 'BANEAR MIEMBRO', 22: 'BANEAR MIEMBRO',
        30: 'CREAR ROL', 31: 'ACTUALIZAR ROL', 32: 'ELIMINAR ROL',
        72: 'ACTUALIZAR SERVIDOR', 82: 'ELIMINAR MENSAJE', 23: 'QUITAR BANEO',
        40: 'CREAR INVITACIÓN', 41: 'ACTUALIZAR INVITACIÓN', 42: 'ELIMINAR INVITACIÓN',
        50: 'CREAR WEBHOOK', 51: 'ACTUALIZAR WEBHOOK', 52: 'ELIMINAR WEBHOOK',
        60: 'CREAR EMOJI', 61: 'ACTUALIZAR EMOJI', 62: 'ELIMINAR EMOJI'
    };
    return actions[actionCode] || `Acción desconocida (${actionCode})`;
}

/////FIN W

// Función para obtener información de cambios
function getChangesInfo(auditLogEntry) {
    if (!auditLogEntry.changes || auditLogEntry.changes.length === 0) {
        return null;
    }

    return auditLogEntry.changes.map(change => ({
        key: change.key,
        old: change.old,
        new: change.new
    }));
}

// Función para obtener información extra según el tipo de acción
function getExtraInfo(auditLogEntry, guild) {
    const actionCode = auditLogEntry.action;
    
    // Para acciones de miembros
    if ([20, 21, 22, 23].includes(actionCode)) {
        return {
            type: 'member_action',
            memberCount: guild.memberCount
        };
    }
    
    // Para acciones de canales
    if ([10, 11, 12].includes(actionCode)) {
        return {
            type: 'channel_action',
            channelCount: guild.channels.cache.size
        };
    }
    
    // Para acciones de roles
    if ([30, 31, 32].includes(actionCode)) {
        return {
            type: 'role_action',
            roleCount: guild.roles.cache.size - 1
        };
    }
    
    return null;
}

// Usar variable de entorno para el token
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
    console.error('ERROR: No se encontró DISCORD_BOT_TOKEN en las variables de entorno');
    process.exit(1);
}

client.login(token);