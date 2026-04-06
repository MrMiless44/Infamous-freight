# SSH Access Hardening Runbook

Use this sequence to provision key-based SSH access and then harden remote SSH.

## 1) Add the public key

```bash
echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCPyyxRDWUwSHYqLXqLZ+lKPs/qvzkTEFJxrfir0mTdvitjLS7jsibyCil4iLyf2JYpsIAx1b39s/v4ukx5Vo6TyHsBNjt0O5uMtI5UVzZjhToBH89XKv9LI7yF9NWkK63bOOJ7gvTiAQVdWy9Y6icTd+FaJq9d6tNcPJKumQ9w+rJUD1/bnXlGNyIBU3NUW6dQr6ptqXIHee3La3UIhq45yJU6XosfVSAGSZGsIUO/6oLvc2CzXolZNC9uRVR+qeor16np/IlMRQaO9Z2zUmgB4Hvyy5TIAZlCCM5Oy4JSg18dd0sIuXp13t2LRbkwqqiVIt7s45m2RHjEk4bHvu3y5oslgo0KIQ4B+cMZMHBw7bLgfYPJqDyyID0HSc9ODrr2AOY4EExmpdlAh+LT1CqNm8z/WVvyoulGP/SbRA0SydtAB16V8ghbDbKjvwF1WDE9kwI2wihDccqx4G7iE2flZ1o43yHvukY5z8HCKPKO+zDupvzWwE70fTj/WXQHAupftoGIYhyKoycNtOfAJICrRheu0fWwPzoV8v15pHOkXaPNeF7h2m7BS3aGp+e/PJpXiMr1C3cZhgVTdUC7+e9k7AMQQMnz97HXuNWU65uTdNguLdKo076WN9AuYkZebL0vq/ILwu6VgldpWYtR6DJ1na9DmmG6xiZ2OhoPWBlduQ==' >> ~/.ssh/authorized_keys
```

## 2) Verify key integrity

```bash
wc -l ~/.ssh/authorized_keys
cat ~/.ssh/authorized_keys
```

Expected checks:

- exactly one line,
- no line breaks,
- starts with `ssh-rsa`.

## 3) Validate login from your local workstation

```bash
ssh user@SERVER_IP
```

If it fails:

```bash
ssh -v user@SERVER_IP
```

Look for:

- `Offering public key`
- `Authentication succeeded`

## 4) Harden SSH (only after key auth works)

Edit `/etc/ssh/sshd_config`:

```text
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
```

Validate and restart:

```bash
sudo sshd -t
sudo systemctl restart ssh
```

## 5) Enable firewall

```bash
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

## Failure checklist

If login still fails, verify:

- username (`ubuntu`, `ec2-user`, `root`, etc.),
- server IP,
- SSH port,
- cloud image key injection behavior,
- host or network firewall rules.
