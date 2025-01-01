import React, {useState} from 'react'
import RoomList from '../RoomList/RoomList'
import Room from '../Room/Room'
import Friends from '../Friends/Friends'
import Statistics from '../Statistics/Statistics'
import scss from './Lobby.module.scss'

const data = [
  {
      "tournamentId": null,
      "matches": [
          {
              "matchId": 1,
              "started": "2024-12-31T17:56:46.716Z",
              "ended": "2024-12-31T17:57:03.298Z",
              "prematureEnd": false,
              "scores": [
                  {
                      "username": "gbohm",
                      "scored": 0,
                      "received": 2
                  },
                  {
                      "username": "gbohm",
                      "scored": 1,
                      "received": 0,
                      "won": true
                  },
                  {
                    "username": "gbohm",
                    "scored": 0,
                    "received": 2,
                },
                {
                    "username": "gbohm",
                    "scored": 1,
                    "received": 0,
                    "left": "2024-12-31T17:56:03.298Z",

                }
              ]
          }
      ]
  },
  {
      "tournamentId": 1,
      "matches": [
          {
              "matchId": 2,
              "started": "2024-12-31T17:58:56.580Z",
              "ended": "2024-12-31T17:59:17.736Z",
              "prematureEnd": false,
              "scores": [
                  {
                      "username": "gbohm",
                      "scored": 1,
                      "received": 1
                  },
                  {
                      "username": "gbohm",
                      "scored": 1,
                      "received": 1
                  }
              ]
          },
          {
            "matchId": 2,
            "started": "2024-12-31T17:58:56.580Z",
            "ended": "2024-12-31T17:59:17.736Z",
            "prematureEnd": false,
            "scores": [
                {
                    "username": "gbohm",
                    "scored": 1,
                    "received": 1
                },
                {
                    "username": "gbohm",
                    "scored": 1,
                    "received": 1
                }
            ]
        },
        {
          "matchId": 2,
          "started": "2024-12-31T17:58:56.580Z",
          "ended": "2024-12-31T17:59:17.736Z",
          "prematureEnd": false,
          "scores": [
              {
                  "username": "gbohm",
                  "scored": 1,
                  "received": 1
              },
              {
                  "username": "gbohm",
                  "scored": 1,
                  "received": 1
              }
          ]
      }
      ]
  },
  {
    "tournamentId": null,
    "matches": [
        {
            "matchId": 1,
            "started": "2024-12-31T17:56:46.716Z",
            "ended": "2024-12-31T17:57:03.298Z",
            "prematureEnd": false,
            "scores": [
                {
                    "username": "gbohm",
                    "scored": 0,
                    "received": 2
                },
                {
                    "username": "gbohm",
                    "scored": 1,
                    "received": 0
                }
            ]
        }
    ]
},
{
    "tournamentId": 1,
    "matches": [
        {
            "matchId": 2,
            "started": "2024-12-31T17:58:56.580Z",
            "ended": "2024-12-31T17:59:17.736Z",
            "prematureEnd": false,
            "scores": [
                {
                    "username": "gbohm",
                    "scored": 1,
                    "received": 1
                },
                {
                    "username": "gbohm",
                    "scored": 1,
                    "received": 1
                }
            ]
        }
    ]
}
];

function Lobby() {
  return (
    <div className={scss.lobby}>
      <div className={scss.top}>
        <RoomList />
        <Room />
      </div>
      <div className={scss.bottom}>
  			<Friends />
        <Statistics title='Test' data={data} />
      </div>
    </div>
  )
}

export default Lobby;
