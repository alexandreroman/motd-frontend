APP_NAME = 'motd-frontend'

SOURCE_IMAGE = os.getenv("SOURCE_IMAGE", default='dev.local/' + APP_NAME + '-source')
LOCAL_PATH = os.getenv("LOCAL_PATH", default='.')
NAMESPACE = os.getenv("NAMESPACE", default='default')
K8S_TEST_CONTEXT = os.getenv("K8S_TEST_CONTEXT", default='tap')

allow_k8s_contexts(K8S_TEST_CONTEXT)

k8s_custom_deploy(
    APP_NAME,
    apply_cmd="tanzu apps workload apply -f config/workload.yaml --update-strategy replace --debug --live-update" +
              " --local-path " + LOCAL_PATH +
              " --source-image " + SOURCE_IMAGE +
              " --namespace " + NAMESPACE +
              " --yes --output yaml",
    delete_cmd="tanzu apps workload delete -f config/workload.yaml --namespace " + NAMESPACE + " --yes",
    deps=['.'],
    container_selector='workload',
    live_update=[
        fall_back_on(['package.json']),
        sync('.', '/workspace')
    ]
)

k8s_resource(APP_NAME, port_forwards=["8080:8080"],
            extra_pod_selectors=[{'carto.run/workload-name': APP_NAME,'app.kubernetes.io/component': 'run'}])
allow_k8s_contexts(K8S_TEST_CONTEXT)
