# MyLove

This is a project for my love. Demo: [https://deer.dedog.top](https://deer.dedog.top/).

## Prerequisite

- Python 3.10

```bash
$ pip install Flask
```

## Run

- Clone this repository
- Start Python HTTP server

```bash
$ cd MyLove/
$ python app.py
```

Now, your entire website is running on http://127.0.0.1:3414.

## Run in daemon

To use the Systemd service, place a unit file to `/etc/systemd/system/mylove.service`

```bash
[Unit]
Description=MyLove HTTP Service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/MyLove
ExecStart=python3 /home/ubuntu/MyLove/app.py
Restart=always

[Install]
WantedBy=multi-user.target
```
