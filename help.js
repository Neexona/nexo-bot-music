const commands = module.exports = {
    'help': `
~help [command]
Apporte la page de commande. Passez une commande pour plus d'informations.`,

    'choose': `
~choose <arg1> | [arg2] ...
Choisit aléatoirement entre le (s) choix fourni (s).`,

    'prune': `
~prune <amount> [options]
Élague les derniers messages <amount>.

    'setavatar': 
~setavatar <image> 
Change l'image du bot.

    'setusername':
~setusername <nom>
Change le nom du bot.

   Options:
      [--bots]            : Seulement effacer les messages du bot.
      [--user <name>]     : Seulement les messages d'un utilisateur précis.
      [--filter <string>] : Nettoie uniquement les messages avec la chaîne spécifiée.

      [--pinned | -p]     : Enlève également les messages épinglés.
      [--silent | -s]     : Supprime la commande et n'affiche pas les résultats.`,

    'role': `[Role Help]

~role give <role[,...]>  : Donne un rôle.
~role take <role[,...]>  : Supprime un rôle.
~role modify <role>      : Modifie un rôle.

#Options
give|take
   [--bots]              : Seulement les rôles du bot.
   [--users]             : Seulement les rôles des utilisateurs.
   [--user <user[,...]>] : Seulement les rôles d'un utilisateur spécifique'.

   [--inrole <role>]     : Changer les rôles pour tout le monde avec le rôle.
   [--notinrole <role>]  : Changer les rôles pour tout le monde sans le rôle.
   [--noroles]           : Changer les rôles pour tout le monde sans rôle.

modify
   [--name <name>]       : Renomme le rôle.
   [--color <color>]     : Change la couleur du rôle.`,

    'music': `
[Music Help]

~music | m <function>
   play <url> | <search> : Ajoute la musique à la playlist.
   skip                  : Skip la musique en cours.
   pause                 : Met la musique en pause.
   resume                : Remet la musique en route.

   queue                 : Affiche la playlist en cours.
   purge                 : Efface la playlist.
   np                    : Affiche le titre de la musique en cours.

   vol | v <0-100>       : Change le volume.

   join                  : Rejoins le channel vocal ou tu es.
   leave                 : Quitte le channel vocal.

Requires a #music text channel.`,

    'ban': `
~ban <mention> [options]
Banni l'utilisateur mentionné.
Vous ne pouvez pas bannir les utilisateurs dans un rôle supérieur.

   Options:
      [--days <number>]   : Supprime l'historique des messages de l'utilisateur.
      [--reason <reason>] : Indique une raison pour bannir l'utilisateur. `,
    'kick': `
~kick <mention> [options]
   Kicks l'utilisateur mentionné.
   Vous ne pouvez pas kick une personne d'un plus haut grade que vous.

   Options:
      [--reason <reason>] : Affiche une raison pour kick l'utilisateur.`
}

