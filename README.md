<img src="./public/images/ansibrest.png" width="48"> Ansibrest - Ansible REST Server
-----


## Abstract

Start REST Server to execute local ansible.

## How to use

```
% npm install ansibrest -g
% # or
% npm install -g git://github.com/muddydixon/ansibrest.git
% cd someproject/
% ls -l
ansible/
% ls ansible
sample1.yml sample2.yml inventories/
% ansibrest -d --ansible-path ./ansible --inventory-path ./ansible/inventories
% curl -X POST -d "host=samplehost001" -d "startAt=Some Task" "http://localhost:8080/api/playbook/sample1.yml"
```
